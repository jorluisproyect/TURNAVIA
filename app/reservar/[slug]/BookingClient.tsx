'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, ShieldCheck, UploadCloud, CreditCard } from 'lucide-react';
import Link from 'next/link';

type Slot={time:string;available:boolean;startsAt:string};
type Availability={id:string;date:string;slots:Slot[]};
type Service={id:string;name:string;description:string;durationMinutes:number;price:number;currency:string};
type PaymentMethod={id:string;name:string;type:string;account_label?:string;account_value?:string;instructions?:string;requires_proof?:boolean;active:boolean};
type State={provider:{slug:string;name:string;initials:string;category:string;activity:string;type:string;location:string;dayStatus:string;delayMinutes:number};services:Service[];availability:Availability[];paymentInstructions:string};

export default function BookingClient({slug}:{slug:string}){
 const [data,setData]=useState<State|null>(null);
 const [methods,setMethods]=useState<PaymentMethod[]>([]);
 const [serviceId,setServiceId]=useState('');
 const [date,setDate]=useState('');
 const [startsAt,setStartsAt]=useState('');
 const [sent,setSent]=useState(false);
 const [resultStatus,setResultStatus]=useState<'PAYMENT_REVIEW'|'CONFIRMED'>('PAYMENT_REVIEW');
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [proof,setProof]=useState<{name:string;dataUrl:string}|null>(null);
 const [form,setForm]=useState({clientName:'',nationalId:'',phone:'',email:'',note:'',paymentMethod:'',paymentReference:'',policyAccepted:false});

 async function loadProvider(selectedServiceId?:string){
   const qs=selectedServiceId?'?serviceId='+encodeURIComponent(selectedServiceId):'';
   const r=await fetch('/api/public/provider/'+encodeURIComponent(slug)+qs);
   const j=await r.json();
   if(!r.ok){setError(j.error||'No se pudo cargar esta agenda');return}
   setData(j);setError('');
   const firstService=j.services?.[0];
   if(!selectedServiceId&&firstService)setServiceId(firstService.id);
   const first=j.availability?.find((a:Availability)=>a.slots?.some((s:Slot)=>s.available))||j.availability?.[0];
   setDate(first?.date||'');
   setStartsAt(first?.slots?.find((s:Slot)=>s.available)?.startsAt||'');
 }

 useEffect(()=>{
   loadProvider().catch(()=>setError('No se pudo cargar esta agenda.'));
   fetch('/api/payment-methods?scope=DOCTOR&slug='+encodeURIComponent(slug)+'&active=1').then(r=>r.json()).then(j=>{
     const ms=j.methods||[];setMethods(ms);if(ms[0])setForm(f=>({...f,paymentMethod:ms[0].name}));
   }).catch(()=>{});
 },[slug]);

 useEffect(()=>{
   if(!serviceId)return;
   loadProvider(serviceId).catch(()=>setError('No se pudo actualizar la disponibilidad para este servicio.'));
 },[serviceId]);

 const current=useMemo(()=>data?.availability.find(a=>a.date===date),[data,date]);
 const service=useMemo(()=>data?.services.find(s=>s.id===serviceId)||data?.services[0],[data,serviceId]);
 const selectedMethod=useMemo(()=>methods.find(m=>m.name===form.paymentMethod),[methods,form.paymentMethod]);
 const requiresProof=selectedMethod?.requires_proof!==false;

 function fileChange(file?:File){
   if(!file)return;
   if(file.size>2_000_000){setError('Usa un comprobante menor de 2 MB.');return}
   const reader=new FileReader();
   reader.onload=()=>setProof({name:file.name,dataUrl:String(reader.result)});
   reader.readAsDataURL(file);
 }

 async function book(){
   if(!service||!startsAt||!form.clientName||!form.phone||!form.email||!form.policyAccepted){
     setError('Completa tus datos y acepta la política de reserva.');return;
   }
   if(requiresProof&&(!form.paymentReference||!proof)){
     setError('Este método requiere referencia y comprobante de pago.');return;
   }
   setLoading(true);setError('');
   const r=await fetch('/api/public/provider/'+encodeURIComponent(slug),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...form,serviceId:service.id,startsAt,paymentProofName:proof?.name||'',paymentProofDataUrl:proof?.dataUrl||''})});
   const j=await r.json();setLoading(false);
   if(!r.ok){setError(j.error||'No se pudo enviar la reserva');return}
   setResultStatus(j.status==='CONFIRMED'?'CONFIRMED':'PAYMENT_REVIEW');
   setSent(true);
 }

 if(error&&!data)return <div className="booking"><div className="container booking-wrap"><div className="profile-card"><h1>No pudimos abrir esta agenda</h1><div className="notice danger">{error}</div><Link href="/explorar" className="btn btn-primary" style={{marginTop:16}}>Ver otros profesionales</Link></div></div></div>;
 if(!data)return <div className="booking"><div className="container booking-wrap"><div className="profile-card">Cargando TUCITA…</div></div></div>;

 const provider=data.provider;
 if(sent)return <div className="booking"><div className="container booking-wrap"><div className="booking-header"><Link href="/" className="brand" style={{justifyContent:'center'}}>TUCITA</Link></div><div className="profile-card" style={{textAlign:'center',padding:'44px 28px'}}><div className="iconbox" style={{margin:'0 auto',width:62,height:62,borderRadius:20}}><CheckCircle2 size={30}/></div><h1 style={{fontSize:34,marginBottom:8}}>{resultStatus==='CONFIRMED'?'Reserva confirmada':'Pago enviado para revisión'}</h1><p className="muted">{resultStatus==='CONFIRMED'?<>Tu reserva con <strong>{provider.name}</strong> quedó confirmada.</>:<>Tu horario quedó preagendado mientras <strong>{provider.name}</strong> revisa el comprobante.</>}</p><div className="notice" style={{margin:'22px auto',maxWidth:540,textAlign:'left'}}><strong>{resultStatus==='CONFIRMED'?'Reserva confirmada.':'Reserva Premium Preagendada.'}</strong><br/>{resultStatus==='CONFIRMED'?'Guarda esta fecha y hora. Puedes crear una cuenta para ver el seguimiento de tu reserva.':'La reserva se confirma cuando el profesional o negocio aprueba el pago. Si no puedes asistir, podrás solicitar una reprogramación según disponibilidad.'}</div><div className="button-row" style={{justifyContent:'center'}}><Link href={'/registro?role=PATIENT&email='+encodeURIComponent(form.email)} className="btn btn-primary">Crear mi cuenta</Link><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div></div></div></div>;

 return <div className="booking"><div className="container booking-wrap">
   <div className="booking-header"><Link href="/" className="brand" style={{justifyContent:'center'}}>TUCITA</Link><p className="muted">Reserva tu servicio en pocos pasos</p></div>
   <section className="profile-card">
     <div className="profile-top"><div className="profile-avatar">{provider.initials}</div><div><h1 style={{fontSize:25,margin:'0 0 4px'}}>{provider.name}</h1><div className="muted">{provider.activity} · {provider.category}</div><div className="row muted" style={{fontSize:13,marginTop:8}}><MapPin size={15}/>{provider.location||'Ubicación por confirmar'}</div></div></div>
     {provider.dayStatus==='DELAYED'&&<div className="notice" style={{marginTop:16}}>Este profesional presenta aproximadamente {provider.delayMinutes} minutos de retraso.</div>}
     <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'24px 0'}}/>

     <strong>1. Elige el servicio</strong>
     <div className="form" style={{marginTop:10}}>
       <div className="field"><select value={serviceId} onChange={e=>setServiceId(e.target.value)}>{data.services.map(s=><option key={s.id} value={s.id}>{s.name} · {s.currency} {s.price} · {s.durationMinutes} min</option>)}</select></div>
       {service&&<div className="notice"><strong>{service.name}</strong> · {service.durationMinutes} min · {service.currency} {service.price}{service.description?<><br/>{service.description}</>:null}</div>}
     </div>

     <div style={{marginTop:22}}><strong>2. Selecciona el día disponible</strong><div className="date-tabs">{data.availability.map(a=><button key={a.id} className={'date-tab '+(date===a.date?'active':'')} onClick={()=>{setDate(a.date);setStartsAt(a.slots.find(s=>s.available)?.startsAt||'')}}><strong>{new Date(a.date+'T12:00:00').toLocaleDateString('es-VE',{weekday:'short',day:'2-digit'})}</strong><div className="muted" style={{fontSize:11,marginTop:3}}>{new Date(a.date+'T12:00:00').toLocaleDateString('es-VE',{month:'short'})}</div></button>)}</div>{!data.availability.length&&<div className="notice" style={{marginTop:10}}>Todavía no hay horarios publicados.</div>}</div>

     <div style={{marginTop:22}}><strong>3. Selecciona la hora</strong><div className="muted" style={{fontSize:12,marginTop:5}}>Solo mostramos horas donde cabe completo el servicio seleccionado.</div><div className="booking-slots">{current?.slots.map(s=><button disabled={!s.available} type="button" className={startsAt===s.startsAt?'selected':''} onClick={()=>setStartsAt(s.startsAt)} key={s.startsAt}>{s.time}</button>)}</div></div>

     <div style={{marginTop:26}}><strong>4. Tus datos</strong><div className="form">
       <div className="field"><label>Nombre completo</label><input value={form.clientName} onChange={e=>setForm({...form,clientName:e.target.value})} placeholder="Escribe tu nombre real"/></div>
       <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:200}}><label>Documento (opcional)</label><input value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:200}}><label>Teléfono</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div></div>
       <div className="field"><label>Correo para confirmaciones</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></div>
       <div className="field"><label>Nota breve (opcional)</label><textarea rows={3} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
     </div></div>

     <div style={{marginTop:26}}><strong>5. Registra el pago</strong>{data.paymentInstructions&&<div className="notice" style={{marginTop:10}}>{data.paymentInstructions}</div>}<div className="form">
       <div className="field"><label>Método de pago</label><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{methods.length?methods.map(m=><option key={m.id} value={m.name}>{m.name}</option>):<option>No hay métodos configurados</option>}</select></div>
       {methods.filter(m=>m.name===form.paymentMethod).map(m=><div className="notice" key={m.id}><strong>{m.name}</strong><br/>{m.account_label&&<>{m.account_label}: <strong>{m.account_value}</strong><br/></>}{m.instructions}</div>)}
       {requiresProof?<><div className="field"><label>Número / referencia del pago</label><input placeholder="Ej. 458923" value={form.paymentReference} onChange={e=>setForm({...form,paymentReference:e.target.value})}/></div>
       <div className="field"><label>Comprobante</label><label className="btn btn-secondary" style={{width:'fit-content',cursor:'pointer'}}><UploadCloud size={16}/> {proof?proof.name:'Subir comprobante'}<input type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e=>fileChange(e.target.files?.[0])}/></label></div></>:<div className="notice"><strong>No requiere comprobante.</strong><br/>Este método permite confirmar la reserva sin subir referencia ni capture.</div>}
     </div></div>

     <label className="notice row" style={{marginTop:16,alignItems:'flex-start',cursor:'pointer'}}><input type="checkbox" checked={form.policyAccepted} onChange={e=>setForm({...form,policyAccepted:e.target.checked})}/><span><strong>Acepto la política de reserva preagendada.</strong><br/>Entiendo que mi reserva se confirma cuando el pago sea aprobado y que las reprogramaciones dependen de la disponibilidad del profesional o negocio.</span></label>
     {error&&<div className="notice danger" style={{marginTop:14}}>{error}</div>}
     <div className="notice row" style={{marginTop:16,alignItems:'flex-start'}}><ShieldCheck size={17} style={{flex:'0 0 auto',marginTop:2}}/><span>{requiresProof?provider.name+' revisará el comprobante antes de confirmar.':'Este método no requiere comprobante y la reserva se confirma al enviarla.'}</span></div>
     <button disabled={loading||!startsAt||!service||!methods.length} className="btn btn-primary" style={{width:'100%',marginTop:16,padding:15}} onClick={book}><CreditCard size={17}/>{loading?'Enviando…':service?(requiresProof?'Enviar pago y preagendar · '+service.currency+' '+service.price:'Confirmar reserva · '+service.currency+' '+service.price):'Selecciona un servicio'}</button>
   </section>
 </div></div>
}
