'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, ShieldCheck, UploadCloud, CreditCard, Navigation, Clock3, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { ReportProviderButton } from '@/components/ReportProviderButton';

type Slot={time:string;available:boolean;startsAt:string;remaining?:number};
type LocationInfo={id:string;name:string;address:string;city:string;state:string;country:string;room:string};
type Availability={id:string;date:string;slots:Slot[];location:LocationInfo};
type Service={id:string;name:string;description:string;summary?:string;serviceImage?:string;travelImage?:string;travelDate?:string;departureTime?:string;returnTime?:string;locationId?:string;capacity?:number;childPrice?:number|null;durationMinutes:number;price:number;currency:string};
type PaymentMethod={id:string;name:string;type:string;account_label?:string;account_value?:string;instructions?:string;requires_proof?:boolean;active:boolean};
type State={provider:{slug:string;name:string;initials:string;category:string;activity:string;type:string;location:string;dayStatus:string;delayMinutes:number;profileImage?:string;workImages?:string[]};services:Service[];availability:Availability[];paymentInstructions:string};

function mapQuery(l:LocationInfo){return [l.address,l.city,l.state,l.country].filter(Boolean).join(', ')}

export default function BookingClient({slug,patientLoggedIn=false}:{slug:string;patientLoggedIn?:boolean}){
 const [data,setData]=useState<State|null>(null);
 const [methods,setMethods]=useState<PaymentMethod[]>([]);
 const [serviceId,setServiceId]=useState('');
 const [date,setDate]=useState('');
 const [startsAt,setStartsAt]=useState('');
 const [sent,setSent]=useState(false);
 const [resultStatus,setResultStatus]=useState<'PAYMENT_REVIEW'|'CONFIRMED'>('PAYMENT_REVIEW');
 const [appointmentId,setAppointmentId]=useState('');
 const [receiptToken,setReceiptToken]=useState('');
 const [emailNotice,setEmailNotice]=useState<'sent'|'pending'>('pending');
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [fx,setFx]=useState<any>(null);
 const [proof,setProof]=useState<{name:string;dataUrl:string}|null>(null);
 const [form,setForm]=useState({clientName:'',nationalId:'',phone:'',email:'',note:'',paymentMethod:'',paymentReference:'',policyAccepted:false});
 const [travelAdults,setTravelAdults]=useState(1);
 const [travelChildren,setTravelChildren]=useState(0);

 async function loadProvider(selectedServiceId?:string){
   const qs=selectedServiceId?'?serviceId='+encodeURIComponent(selectedServiceId):'';
   const r=await fetch('/api/public/provider/'+encodeURIComponent(slug)+qs);
   const j=await r.json();
   if(!r.ok){setError(j.error||'No se pudo cargar esta agenda');return}
   setData(j);setError('');
   const firstService=j.services?.[0];
   if(!selectedServiceId&&firstService)setServiceId(firstService.id);
   const selected=j.services?.find((s:Service)=>s.id===(selectedServiceId||firstService?.id))||firstService;
   const preferred=selected?.travelDate
     ?j.availability?.find((a:Availability)=>a.date===selected.travelDate&&a.slots?.some((s:Slot)=>s.available))
     :null;
   const first=preferred||j.availability?.find((a:Availability)=>a.slots?.some((s:Slot)=>s.available))||j.availability?.[0];
   setDate(first?.date||selected?.travelDate||'');
   setStartsAt(first?.slots?.find((s:Slot)=>s.available)?.startsAt||'');
 }

 useEffect(()=>{
   loadProvider().catch(()=>setError('No se pudo cargar esta agenda.'));
   fetch('/api/fx').then(r=>r.json()).then(setFx).catch(()=>{});
   fetch('/api/payment-methods?scope=DOCTOR&slug='+encodeURIComponent(slug)+'&active=1').then(r=>r.json()).then(j=>{
     const ms=j.methods||[];setMethods(ms);if(ms[0])setForm(f=>({...f,paymentMethod:ms[0].name}));
   }).catch(()=>{});
   if(patientLoggedIn){
     fetch('/api/me/patient',{cache:'no-store'}).then(r=>r.json()).then(j=>{
       const p=j?.patient;
       if(!p)return;
       setForm(f=>({
         ...f,
         clientName:f.clientName||String(p.name||''),
         nationalId:f.nationalId||String(p.nationalId||''),
         phone:f.phone||String(p.phone||''),
         email:f.email||String(p.email||'')
       }));
     }).catch(()=>{});
   }
 },[slug,patientLoggedIn]);

 useEffect(()=>{
   if(!serviceId)return;
   setTravelAdults(1);setTravelChildren(0);
   loadProvider(serviceId).catch(()=>setError('No se pudo actualizar la disponibilidad para este servicio.'));
 },[serviceId]);

 useEffect(()=>{
   if(!sent||resultStatus!=='PAYMENT_REVIEW'||!appointmentId||!receiptToken)return;
   const timer=setInterval(async()=>{
     try{
       const r=await fetch('/api/public/appointments/'+encodeURIComponent(appointmentId)+'/status?token='+encodeURIComponent(receiptToken),{cache:'no-store'});
       const j=await r.json();
       if(r.ok&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(String(j.status))){
         setResultStatus('CONFIRMED');
       }
     }catch{}
   },8000);
   return()=>clearInterval(timer);
 },[sent,resultStatus,appointmentId,receiptToken]);

 const dates=useMemo(()=>Array.from(new Set((data?.availability||[]).map(a=>a.date))),[data]);
 const currentBlocks=useMemo(()=>data?.availability.filter(a=>a.date===date)||[],[data,date]);
 const selectedBlock=useMemo(()=>currentBlocks.find(a=>a.slots.some(s=>s.startsAt===startsAt))||currentBlocks[0],[currentBlocks,startsAt]);
 const service=useMemo(()=>data?.services.find(s=>s.id===serviceId)||data?.services[0],[data,serviceId]);
 const selectedMethod=useMemo(()=>methods.find(m=>m.name===form.paymentMethod),[methods,form.paymentMethod]);
 const requiresProof=selectedMethod?.requires_proof!==false;
 function conv(amount:number,from:string,to:string){
   const rates=fx?.rates||{};const f=Number(rates[from]),t=Number(rates[to]);if(!(f>0)||!(t>0))return null;return amount/f*t;
 }
 function eqText(amount?:number){
   if(!fx?.available||!service)return '';
   const base=amount===undefined?service.price:amount;
   const parts=['USD','EUR','USDT','VES'].filter(x=>x!==service.currency).map(cur=>{
     const v=conv(base,service.currency,cur);
     if(v===null)return '';
     const n=new Intl.NumberFormat('es-VE',{maximumFractionDigits:cur==='VES'?2:2}).format(v);
     return n+' '+cur;
   }).filter(Boolean);
   return parts.join(' · ');
 }

 function fileChange(file?:File){
   if(!file)return;
   if(file.size>2_000_000){setError('Usa un comprobante menor de 2 MB.');return}
   const reader=new FileReader();
   reader.onload=()=>setProof({name:file.name,dataUrl:String(reader.result)});
   reader.readAsDataURL(file);
 }

 async function book(){
   if(!service||!startsAt||!selectedBlock?.location?.id||!form.clientName||!form.phone||!form.email||!form.policyAccepted){
     setError('Completa tus datos y acepta la política de reserva.');return;
   }
   const remaining=selectedBlock?.slots?.find(s=>s.startsAt===startsAt)?.remaining;
   const partySize=travelAdults+travelChildren;
   if(data&&['viaje','turismo','tour','excurs','full day'].some(x=>(data.provider.category+' '+data.provider.activity).toLowerCase().includes(x))&&typeof remaining==='number'&&partySize>remaining){
     setError('Solo quedan '+remaining+' cupo'+(remaining===1?'':'s')+' para esta salida.');return;
   }
   if(requiresProof&&(!form.paymentReference||!proof)){
     setError('Este método requiere referencia y comprobante de pago.');return;
   }
   setLoading(true);setError('');
   const r=await fetch('/api/public/provider/'+encodeURIComponent(slug),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,serviceId:service.id,startsAt,locationId:selectedBlock?.location?.id||'',travelAdults,travelChildren,paymentProofName:proof?.name||'',paymentProofDataUrl:proof?.dataUrl||''})});
   const j=await r.json();setLoading(false);
   if(!r.ok){setError(j.error||'No se pudo enviar la reserva');return}
   setAppointmentId(String(j.appointmentId||''));
   setReceiptToken(String(j.receiptToken||''));
   setEmailNotice(j.emailNotice==='sent'?'sent':'pending');
   setResultStatus(j.status==='CONFIRMED'?'CONFIRMED':'PAYMENT_REVIEW');
   setSent(true);
 }

 if(error&&!data)return <div className="booking"><div className="container booking-wrap"><div className="profile-card"><h1>No pudimos abrir esta agenda</h1><div className="notice danger">{error}</div><Link href="/explorar" className="btn btn-primary" style={{marginTop:16}}>Ver otros profesionales</Link></div></div></div>;
 if(!data)return <div className="booking"><div className="container booking-wrap"><div className="profile-card">Cargando TUCITA…</div></div></div>;

 const provider=data.provider;
 const travelMode=['viaje','turismo','tour','excurs','full day'].some(x=>(provider.category+' '+provider.activity).toLowerCase().includes(x));
 const childUnitPrice=service?.childPrice===null||service?.childPrice===undefined?Number(service?.price||0):Number(service.childPrice||0);
 const travelTotal=service?(travelAdults*Number(service.price||0)+travelChildren*childUnitPrice):0;
 const partySize=travelAdults+travelChildren;
 const remainingSeats=selectedBlock?.slots?.find(s=>s.startsAt===startsAt)?.remaining;
 if(sent){
   const receiptUrl=appointmentId&&receiptToken?'/api/public/appointments/'+encodeURIComponent(appointmentId)+'/receipt?token='+encodeURIComponent(receiptToken):'';
   return <div className="booking"><div className="container booking-wrap"><div className="booking-header"><Link href="/" className="brand" style={{justifyContent:'center'}}>TUCITA</Link></div><div className="profile-card" style={{textAlign:'center',padding:'44px 28px'}}><div className="iconbox" style={{margin:'0 auto',width:62,height:62,borderRadius:20}}><CheckCircle2 size={30}/></div><h1 style={{fontSize:34,marginBottom:8}}>{resultStatus==='CONFIRMED'?'Reserva confirmada':'Pago enviado para revisión'}</h1><p className="muted">{resultStatus==='CONFIRMED'?<>Tu reserva con <strong>{provider.name}</strong> quedó confirmada.</>:<>Tu horario quedó preagendado mientras <strong>{provider.name}</strong> revisa el comprobante.</>}</p><div className="notice" style={{margin:'22px auto',maxWidth:560,textAlign:'left'}}><strong>{resultStatus==='CONFIRMED'?'Tu recibo TUCITA ya está disponible.':'Pago recibido y en revisión.'}</strong><br/>{resultStatus==='CONFIRMED'?<>Puedes descargar ahora tu comprobante PDF con el <strong>código QR de la cita</strong>. {emailNotice==='sent'?'También fue enviado a tu correo.':'Si el correo tarda, puedes descargarlo aquí.'}</>:<>En cuanto el profesional o negocio apruebe el pago, esta pantalla se actualizará y habilitará tu <strong>recibo PDF + QR</strong>. También lo enviaremos a <strong>{form.email}</strong>.</>}</div><div className="button-row" style={{justifyContent:'center',flexWrap:'wrap'}}>{resultStatus==='CONFIRMED'&&receiptUrl&&<a href={receiptUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Descargar recibo + QR</a>}{patientLoggedIn?<><Link href="/paciente" className="btn btn-primary">Volver a mis citas</Link><Link href="/explorar" className="btn btn-secondary">Explorar más</Link></>:<><Link href={'/registro?role=PATIENT&email='+encodeURIComponent(form.email)} className="btn btn-secondary">Crear mi cuenta</Link><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></>}</div></div></div></div>;
 }

 return <div className="booking"><div className="container booking-wrap">
   <div className="booking-header">{patientLoggedIn?<Link href="/explorar" className="btn btn-secondary">← Volver a explorar</Link>:<Link href="/" className="brand" style={{justifyContent:'center'}}>TUCITA</Link>}<p className="muted">Reserva tu servicio en pocos pasos</p></div>
   <section className="profile-card">
     <div className="profile-top">{provider.profileImage?<img src={provider.profileImage} alt={provider.name} style={{width:76,height:76,borderRadius:24,objectFit:'cover',flex:'0 0 auto'}}/>:<div className="profile-avatar">{provider.initials}</div>}<div><h1 style={{fontSize:25,margin:'0 0 4px'}}>{provider.name}</h1><div className="muted">{provider.activity} · {provider.category}</div>{!travelMode&&<div className="row muted" style={{fontSize:13,marginTop:8}}><MapPin size={15}/>{provider.location||'Ubicación por confirmar'}</div>}</div></div>
     {(provider.workImages||[]).length>0&&<div style={{marginTop:16}}><div className="muted" style={{fontSize:12,marginBottom:8}}>Referencias de trabajos</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8}}>{(provider.workImages||[]).map((img,i)=><img key={i} src={img} alt={'Referencia '+(i+1)} style={{width:'100%',height:92,borderRadius:14,objectFit:'cover'}}/>)}</div></div>}
     {provider.dayStatus==='DELAYED'&&<div className="notice" style={{marginTop:16}}>Este profesional presenta aproximadamente {provider.delayMinutes} minutos de retraso.</div>}
     <ReportProviderButton slug={provider.slug}/>
     <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'24px 0'}}/>

     <strong>1. {travelMode?'Elige el viaje':'Elige el servicio'}</strong>
     <div className="form" style={{marginTop:10}}>
       {travelMode
         ?<div className="travel-service-grid">{data.services.map(s=><button type="button" key={s.id} className={'travel-service-card '+(serviceId===s.id?'selected':'')} onClick={()=>setServiceId(s.id)}>
            {s.travelImage?<img src={s.travelImage} alt={s.name}/>:<div className="travel-service-placeholder">TUCITA · VIAJE</div>}
            <div className="travel-service-content">
              <div className="row space" style={{gap:8,alignItems:'flex-start'}}><strong>{s.name}</strong><span className="pill">{s.currency} {s.price} / adulto</span></div>
              {s.travelDate&&<div className="travel-service-date"><CalendarDays size={14}/>{new Date(s.travelDate+'T12:00:00').toLocaleDateString('es-VE',{weekday:'short',day:'2-digit',month:'short'})}{s.departureTime&&<><Clock3 size={14}/>{s.departureTime}{s.returnTime?'–'+s.returnTime:''}</>}</div>}
              <p>{s.summary||s.description||'Ver detalles del viaje'}</p>
              <div className="muted" style={{fontSize:11}}>{s.childPrice!==null&&s.childPrice!==undefined?'Niño '+s.currency+' '+s.childPrice+' · ':''}Duración {s.durationMinutes} min · {s.capacity||1} cupo{Number(s.capacity||1)===1?'':'s'} · {serviceId===s.id?'Seleccionado':'Toca para elegir'}</div>
            </div>
          </button>)}</div>
         :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10}}>
            {data.services.map(s=><button type="button" key={s.id} onClick={()=>setServiceId(s.id)} className={serviceId===s.id?'selected':''} style={{textAlign:'left',padding:10,border:'1px solid var(--line)',borderRadius:16,background:serviceId===s.id?'#ecfdf5':'#fff',cursor:'pointer'}}>
              {s.serviceImage?<img src={s.serviceImage} alt={s.name} style={{width:'100%',height:96,borderRadius:12,objectFit:'cover',marginBottom:8}}/>:<div style={{height:54,display:'grid',placeItems:'center',borderRadius:12,background:'#f3f8f6',marginBottom:8}}><CreditCard size={20}/></div>}
              <strong style={{display:'block'}}>{s.name}</strong>
              <span className="muted" style={{fontSize:12}}>{s.durationMinutes} min · {s.currency} {s.price}</span>
            </button>)}
          </div>}
       {service&&<div className="notice" style={{marginTop:travelMode?4:10}}>
         {travelMode&&service.travelImage&&<img src={service.travelImage} alt={service.name} style={{width:'100%',maxHeight:260,objectFit:'cover',borderRadius:14,marginBottom:10}}/>}
         {!travelMode&&service.serviceImage&&<img src={service.serviceImage} alt={service.name} style={{width:'100%',maxHeight:320,objectFit:'cover',borderRadius:14,marginBottom:10}}/>}
         <strong>{service.name}</strong> · {service.durationMinutes} min · {service.currency} {service.price} por adulto{travelMode&&service.childPrice!==null&&service.childPrice!==undefined?' · niño '+service.currency+' '+service.childPrice:''}
         {travelMode&&service.travelDate?<><br/><strong>{new Date(service.travelDate+'T12:00:00').toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long'})}</strong>{service.departureTime?' · salida '+service.departureTime:''}{service.returnTime?' · regreso aprox. '+service.returnTime:''}</>:null}
         {service.description?<><br/>{service.description}</>:null}
         {eqText(travelMode?travelTotal:service.price)?<><br/><span className="muted" style={{fontSize:11}}>Equivalencia aprox.: {eqText(travelMode?travelTotal:service.price)}</span></>:null}
       </div>}
     </div>

     {travelMode
       ?<div style={{display:'grid',gap:12,marginTop:20}}>
          <div className="notice" style={{border:'2px solid #0f766e'}}>
            <strong>Salida programada</strong><br/>
            {service?.travelDate?new Date(service.travelDate+'T12:00:00').toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long'}):'Fecha por confirmar'}
            {service?.departureTime?' · '+service.departureTime:''}
            {service?.returnTime?' · regreso aprox. '+service.returnTime:''}
            <br/>
            <span className="muted" style={{fontSize:12}}>{startsAt&&typeof remainingSeats==='number'?remainingSeats+' cupo'+(remainingSeats===1?'':'s')+' disponible'+(remainingSeats===1?'':'s'):'Esta salida no tiene cupos disponibles en este momento.'}</span>
          </div>
          <div className="notice">
            <strong>¿Cuántas personas viajan?</strong>
            <div className="row" style={{gap:12,flexWrap:'wrap',marginTop:10}}>
              <div className="field" style={{flex:1,minWidth:130}}><label>Adultos</label><input type="number" min="1" max={Math.max(1,Number(remainingSeats||service?.capacity||1))} value={travelAdults} onChange={e=>setTravelAdults(Math.max(1,Math.floor(Number(e.target.value||1))))}/></div>
              <div className="field" style={{flex:1,minWidth:130}}><label>Niños</label><input type="number" min="0" max={Math.max(0,Number(remainingSeats||service?.capacity||1)-1)} value={travelChildren} onChange={e=>setTravelChildren(Math.max(0,Math.floor(Number(e.target.value||0))))}/></div>
            </div>
            <div className="row space" style={{gap:10,marginTop:10,flexWrap:'wrap'}}>
              <span>{partySize} viajero{partySize===1?'':'s'} · {travelAdults} adulto{travelAdults===1?'':'s'}{travelChildren?' + '+travelChildren+' niño'+(travelChildren===1?'':'s'):''}</span>
              <strong>Total: {service?.currency} {travelTotal.toFixed(2)}</strong>
            </div>
            {typeof remainingSeats==='number'&&partySize>remainingSeats&&<div className="notice danger" style={{marginTop:8}}>Solo quedan {remainingSeats} cupos disponibles.</div>}
          </div>
        </div>
       :<>
          <div style={{marginTop:22}}><strong>2. Selecciona el día disponible</strong><div className="date-tabs">{dates.map(d=><button key={d} className={'date-tab '+(date===d?'active':'')} onClick={()=>{setDate(d);const first=data.availability.find(a=>a.date===d&&a.slots.some(s=>s.available));setStartsAt(first?.slots.find(s=>s.available)?.startsAt||'')}}><strong>{new Date(d+'T12:00:00').toLocaleDateString('es-VE',{weekday:'short',day:'2-digit'})}</strong><div className="muted" style={{fontSize:11,marginTop:3}}>{new Date(d+'T12:00:00').toLocaleDateString('es-VE',{month:'short'})}</div></button>)}</div>{!data.availability.length&&<div className="notice" style={{marginTop:10}}>Todavía no hay horarios publicados.</div>}</div>
          <div style={{marginTop:22}}><strong>3. Selecciona la hora y el lugar</strong><div className="muted" style={{fontSize:12,marginTop:5}}>Cada bloque indica claramente dónde estará el profesional o negocio.</div><div style={{display:'grid',gap:12,marginTop:12}}>{currentBlocks.map(block=><div className="notice" key={block.id} style={{padding:14}}><div className="row" style={{alignItems:'flex-start',gap:8}}><MapPin size={17}/><div><strong style={{fontSize:15}}>Atención en {block.location.name||'ubicación por confirmar'}</strong><div className="muted" style={{fontSize:12,marginTop:3}}>{[block.location.address,block.location.city,block.location.state,block.location.country].filter(Boolean).join(' · ')}{block.location.room?<><br/><strong>{block.location.room}</strong></>:null}</div></div></div><div className="booking-slots" style={{marginTop:10}}>{block.slots.map(s=><button disabled={!s.available} type="button" className={startsAt===s.startsAt?'selected':''} onClick={()=>setStartsAt(s.startsAt)} key={block.id+'-'+s.startsAt}>{s.time}</button>)}</div></div>)}</div></div>
          {selectedBlock&&startsAt&&<div className="notice" style={{marginTop:14,border:'2px solid #0f766e'}}><strong>Tu cita será en: {selectedBlock.location.name}</strong><br/>{[selectedBlock.location.address,selectedBlock.location.city,selectedBlock.location.state,selectedBlock.location.country].filter(Boolean).join(' · ')}{selectedBlock.location.room?<><br/><strong>{selectedBlock.location.room}</strong></>:null}{mapQuery(selectedBlock.location)&&<><div style={{marginTop:12,borderRadius:14,overflow:'hidden',border:'1px solid var(--line)'}}><iframe title={'Mapa de '+selectedBlock.location.name} src={'https://www.google.com/maps?q='+encodeURIComponent(mapQuery(selectedBlock.location))+'&output=embed'} width="100%" height="220" style={{border:0,display:'block'}} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div><a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(selectedBlock.location))} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{marginTop:10}}><Navigation size={15}/> Cómo llegar</a></>}</div>}
        </>}

     <div style={{marginTop:26}}><strong>{travelMode?'2. Tus datos':'4. Tus datos'}</strong><div className="form">
       <div className="field"><label>Nombre completo</label><input value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} placeholder="Escribe tu nombre real"/></div>
       <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:200}}><label>Documento (opcional)</label><input value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:200}}><label>Teléfono</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div></div>
       <div className="field"><label>Correo para confirmaciones</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></div>
       <div className="field"><label>Nota breve (opcional)</label><textarea rows={3} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
     </div></div>

     <div style={{marginTop:26}}><strong>{travelMode?'3. Registra el pago':'5. Registra el pago'}</strong>{data.paymentInstructions&&<div className="notice" style={{marginTop:10}}>{data.paymentInstructions}</div>}<div className="form">
       <div className="field"><label>Método de pago</label><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{methods.length?methods.map(m=><option key={m.id} value={m.name}>{m.name}</option>):<option>No hay métodos configurados</option>}</select></div>
       {methods.filter(m=>m.name===form.paymentMethod).map(m=><div className="notice" key={m.id}><strong>{m.name}</strong><br/>{m.account_label&&<><span style={{whiteSpace:'pre-line'}}>{m.account_label}: <strong>{m.account_value}</strong></span><br/></>}{m.instructions}</div>)}
       {requiresProof?<><div className="field"><label>{selectedMethod?.type==='BINANCE'?'ID / TxID de Binance':selectedMethod?.type==='PAYPAL'?'ID / referencia de PayPal':'Número / referencia del pago'}</label><input placeholder={selectedMethod?.type==='BINANCE'?'Pega el ID / TxID de Binance':selectedMethod?.type==='PAYPAL'?'Pega el ID de la operación PayPal':'Ej. 458923'} value={form.paymentReference} onChange={e=>setForm({...form,paymentReference:e.target.value})}/></div>
       <div className="field"><label>Comprobante</label><label className="btn btn-secondary" style={{width:'fit-content',cursor:'pointer'}}><UploadCloud size={16}/> {proof?proof.name:'Subir comprobante'}<input type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e=>fileChange(e.target.files?.[0])}/></label></div></>:<div className="notice"><strong>No requiere comprobante.</strong><br/>Este método permite confirmar la reserva sin subir referencia ni capture.</div>}
     </div></div>

     <label className="notice row" style={{marginTop:16,alignItems:'flex-start',cursor:'pointer'}}><input type="checkbox" checked={form.policyAccepted} onChange={e=>setForm({...form,policyAccepted:e.target.checked})}/><span><strong>Acepto la política de reserva preagendada.</strong><br/>Entiendo que mi reserva se confirma cuando el pago sea aprobado y que las reprogramaciones dependen de la disponibilidad del profesional o negocio.</span></label>
     {error&&<div className="notice danger" style={{marginTop:14}}>{error}</div>}
     <div className="notice row" style={{marginTop:16,alignItems:'flex-start'}}><ShieldCheck size={17} style={{flex:'0 0 auto',marginTop:2}}/><span>{requiresProof?provider.name+' revisará el comprobante antes de confirmar.':'Este método no requiere comprobante y la reserva se confirma al enviarla.'}</span></div>
     <button disabled={loading||!startsAt||!service||!methods.length} className="btn btn-primary" style={{width:'100%',marginTop:16,padding:15}} onClick={book}><CreditCard size={17}/>{loading?'Enviando…':service?(requiresProof?'Enviar pago y preagendar · '+service.currency+' '+(travelMode?travelTotal.toFixed(2):service.price):'Confirmar reserva · '+service.currency+' '+(travelMode?travelTotal.toFixed(2):service.price)):'Selecciona un servicio'}</button>
   </section>
 </div></div>
}
