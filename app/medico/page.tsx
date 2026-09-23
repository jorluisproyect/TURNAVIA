'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarPlus, Clock3, Link2, Share2, Settings2, Eye, Plus, UserRound, BriefcaseBusiness, Pencil, Trash2, ExternalLink, CheckCircle2, MapPin, ScanLine, FileText, ImagePlus, X, Navigation } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';
import { COUNTRY_SUGGESTIONS, COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';
import { categoryUsesWorkReferences } from '@/lib/provider-media';
import { countryDialCode, digitsOnly, phoneMaxLength } from '@/lib/phone';

const labels:any={PAYMENT_REVIEW:'Pago en revisión',PAYMENT_REJECTED:'Pago rechazado',CONFIRMED:'Confirmada',ON_THE_WAY:'En camino',ARRIVED:'Llegó',IN_CONSULTATION:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asistió'};

function splitPhone(value:string){
 const v=String(value||'').trim();
 const found=[...COUNTRY_PHONE_CODES].sort((a,b)=>b.code.length-a.code.length).find(x=>v.startsWith(x.code));
 const code=found?.code||'+58';
 return {country:found?.country||'Venezuela',local:digitsOnly(found?v.slice(code.length):v,phoneMaxLength(code))};
}
async function resizeImage(file:File,width:number,height:number,quality=.72){
 if(file.size>5_000_000)throw new Error('La imagen supera 5 MB.');
 const src=URL.createObjectURL(file);
 try{
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=src});
  const ratio=Math.max(width/img.width,height/img.height);
  const sw=width/ratio,sh=height/ratio,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.getContext('2d')?.drawImage(img,sx,sy,sw,sh,0,0,width,height);
  return canvas.toDataURL('image/webp',quality);
 }finally{URL.revokeObjectURL(src)}
}
function mapQuery(l:any){return [l?.address,l?.city,l?.state,l?.country].filter(Boolean).join(', ')}


export default function Medico(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [toast,setToast]=useState('');
  const {busy:saving,run:runSave}=useActionLock();
 const [origin,setOrigin]=useState('');
 const [modal,setModal]=useState<'profile'|'availability'|'settings'|'service'|'status'|'location'|null>(null);
 const [profile,setProfile]=useState<any>({});
 const [settings,setSettings]=useState<any>({});
 const [service,setService]=useState({id:'',name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
 const [av,setAv]=useState({date:'',start:'08:00',end:'12:00',slotMinutes:15,locationId:''});
 const [locationForm,setLocationForm]=useState({id:'',name:'',address:'',city:'',state:'',country:'Venezuela',room:''});
 const [dayStatus,setDayStatus]=useState({status:'NORMAL',delayMinutes:0,note:''});
 const [fx,setFx]=useState<any>(null);

 const load=()=>fetch('/api/me/provider').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
   if(!ok){setError(j.error||'No se pudo abrir tu panel');return}
   setData(j);setError('');
   const phoneParts=splitPhone(j.provider.phone||'');
   setProfile({name:j.provider.name,phoneCountry:phoneParts.country,phoneLocal:phoneParts.local,nationalId:j.provider.nationalId||'',birthDate:j.provider.birthDate||'',category:j.provider.category,activity:j.provider.activity,type:j.provider.type,profileImage:j.provider.profileImage||'',workImages:j.provider.workImages||[],locationName:j.provider.location?.name||'',address:j.provider.location?.address||'',city:j.provider.location?.city||'',state:j.provider.location?.state||'',country:j.provider.location?.country||'Venezuela'});
   setSettings({price:j.provider.price,currency:j.provider.currency,paymentInstructions:j.provider.paymentInstructions,defaultMinutes:j.provider.defaultMinutes,acceptsOnlineBooking:j.provider.acceptsOnlineBooking});
   setDayStatus({status:j.provider.dayStatus,delayMinutes:j.provider.delayMinutes,note:''});
 }).catch(()=>setError('No se pudo conectar con TUCITA.'));

 useEffect(()=>{load();setOrigin(window.location.origin);fetch('/api/fx').then(r=>r.json()).then(setFx).catch(()=>{})},[]);
 const upcoming=useMemo(()=>data?.appointments?.filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-86400000)||[],[data]);
 const review=useMemo(()=>upcoming.filter((a:any)=>a.status==='PAYMENT_REVIEW'),[upcoming]);
 const confirmed=useMemo(()=>upcoming.filter((a:any)=>['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION'].includes(a.status)),[upcoming]);
 const nextAppointment=useMemo(()=>[...confirmed].filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-3600000).sort((a:any,b:any)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime())[0],[confirmed]);

 async function patch(body:any){
   return (await runSave(async()=>{
     const action=String(body.action||'');
     showActionFeedback('saving',action==='approve_payment'?'Confirmando el pago…':action==='resend_receipt_email'?'Enviando comprobante al correo…':'Guardando los cambios…');
     try{
       const r=await fetch('/api/me/provider',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
       const j=await r.json();
       if(!r.ok){showActionFeedback('error',j.error||'No se pudo guardar. Tus cambios no fueron confirmados.');return false}
       const descriptions:Record<string,string>={
         profile:'Tu perfil se actualizó correctamente.',add_location:'Ubicación guardada.',update_location:'Ubicación actualizada.',
         delete_location:'Ubicación eliminada.',add_service:'Servicio agregado.',update_service:'Servicio actualizado.',
         add_availability:'Horario publicado.',delete_availability:'Horario eliminado.',settings:'Configuración guardada.',
         day_status:'Estado actualizado.',approve_payment:'Pago aprobado y reserva confirmada.',
         reject_payment:'Pago rechazado.',appointment_status:'Estado de la reserva actualizado.',
         resend_receipt_email:'Comprobante reenviado al correo del cliente.'
       };
       setModal(null);
       showActionFeedback('success',j.message||descriptions[action]||'Tus cambios fueron guardados correctamente.');
       await load();
       return true;
     }catch{
       showActionFeedback('error','No se pudo conectar con TUCITA. Revisa tu conexión e inténtalo de nuevo.');
       return false;
     }
   }))??false;
 }
 async function profileImageChange(file?:File){
   if(!file)return;
   try{const dataUrl=await resizeImage(file,256,256,.75);setProfile((x:any)=>({...x,profileImage:dataUrl}));}
   catch(e:any){setToast(e?.message||'No se pudo procesar la imagen.')}
 }
 async function workImageChange(file?:File){
   if(!file)return;
   if((profile.workImages||[]).length>=4){setToast('Puedes cargar hasta 4 fotos de referencia.');return}
   try{const dataUrl=await resizeImage(file,360,240,.7);setProfile((x:any)=>({...x,workImages:[...(x.workImages||[]),dataUrl].slice(0,4)}));}
   catch(e:any){setToast(e?.message||'No se pudo procesar la imagen.')}
 }
 async function copy(){
   const path=data?.provider?.publicPath||(data?.provider?.slug?'/reservar/'+data.provider.slug:'');
   if(!path)return;
   await navigator.clipboard.writeText(location.origin+path);
   setToast('Enlace para clientes copiado');setTimeout(()=>setToast(''),1800);
 }
 async function share(){
   const path=data?.provider?.publicPath||(data?.provider?.slug?'/reservar/'+data.provider.slug:'');
   if(!path)return;
   const url=location.origin+path;
   if(navigator.share)await navigator.share({title:'Reserva en TUCITA',text:'Reserva tu cita o servicio conmigo en TUCITA',url});else copy();
 }
 function openAvailability(){
   const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Caracas'});
   setAv(v=>({...v,date:v.date||today,locationId:v.locationId||data?.locations?.[0]?.id||''}));
   setModal('availability');
 }
 function newLocation(){
   setLocationForm({id:'',name:'',address:'',city:'',state:'',country:'Venezuela',room:''});
   setModal('location');
 }
 function editLocation(l:any){
   setLocationForm({id:l.id,name:l.name||'',address:l.address||'',city:l.city||'',state:l.state||'',country:l.country||'Venezuela',room:l.room||''});
   setModal('location');
 }
 async function saveLocation(){
   if(!locationForm.name.trim()){setToast('Escribe el nombre de la ubicación.');return}
   if(!locationForm.address.trim()||locationForm.address.trim().length<6){setToast('Escribe la dirección exacta donde será atendido el cliente.');return}
   if(!locationForm.city.trim()){setToast('Indica la ciudad.');return}
   if(!locationForm.country.trim()){setToast('Indica el país.');return}
   const action=locationForm.id?'update_location':'add_location';
   const ok=await patch({action,...locationForm});
   if(ok)setLocationForm({id:'',name:'',address:'',city:'',state:'',country:'Venezuela',room:''});
 }
 function converted(amount:number,from:string,to:string){
   const rates=fx?.rates||{};
   const f=Number(rates[from]),t=Number(rates[to]);
   if(!(f>0)||!(t>0))return null;
   return Number(amount||0)/f*t;
 }
 function money(v:number|null,currency:string){
   if(v===null||!Number.isFinite(v))return '—';
   return new Intl.NumberFormat('es-VE',{minimumFractionDigits:currency==='VES'?2:2,maximumFractionDigits:currency==='VES'?2:2}).format(v)+' '+currency;
 }
 function fxPreview(amount:number,currency:string){
   if(!fx?.available||!amount)return null;
   const targets=currency==='VES'?['USD','EUR','USDT']:currency==='USD'?['VES','EUR','USDT']:['USD','VES','EUR'].filter(x=>x!==currency);
   const label=(cur:string)=>cur==='VES'?'Bs':cur;
   return <div className="live-fx" aria-live="polite"><span>≈</span>{targets.map(cur=>{const v=converted(amount,currency,cur);return <span key={cur}><strong>{v===null?'—':new Intl.NumberFormat('es-VE',{maximumFractionDigits:2}).format(v)}</strong> {label(cur)}</span>})}<small>referencia automática</small></div>;
 }
 function newService(){
   setService({id:'',name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
   setModal('service');
 }
 function editService(s:any){
   setService({id:s.id,name:s.name,description:s.description||'',durationMinutes:Number(s.durationMinutes||30),price:Number(s.price||0),currency:s.currency||'USD'});
   setModal('service');
 }
 async function saveService(){
   const action=service.id?'update_service':'add_service';
   const ok=await patch({action,...service});
   if(ok)setService({id:'',name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
 }

 if(error&&!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><section className="panel"><h1>Tu panel profesional</h1><div className="notice danger">{error}</div></section></main></div>;
 if(!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main">Cargando tu cuenta…</main></div>;
 const p=data.provider;
 const publicPath=p.publicPath||('/reservar/'+p.slug);
 const publicUrl=(origin||'https://tucita.com.ve')+publicPath;
 const activity=String(p.activity||'').toLowerCase();
 const referencesEnabled=categoryUsesWorkReferences(p.category,p.activity);
 const serviceHint=activity.includes('barber')?'Ej.: Corte clásico, Fade, Corte + barba, Barba completa':activity.includes('manicur')||activity.includes('uña')?'Ej.: Manicura, Semipermanente, Acrílicas, Jelly, Nail art, Retiro, Mantenimiento':'Crea cada servicio por separado con su duración y precio.';

 return <div className="dashboard"><Sidebar role="medico"/><main className="main">
  <div id="perfil" className="topbar"><div className="row" style={{gap:12,alignItems:'center'}}>{p.profileImage?<img src={p.profileImage} alt="" style={{width:54,height:54,borderRadius:18,objectFit:'cover',flex:'0 0 auto'}}/>:<div className="profile-avatar" style={{width:54,height:54}}><UserRound size={24}/></div>}<div><div className="muted" style={{fontSize:13}}>{p.category} · {p.activity}</div><h1>Hola, {p.name}</h1>{p.subscriptionStatus==='TRIAL'&&p.trialEndsAt&&<div className="muted" style={{fontSize:12}}>Prueba disponible hasta {new Date(p.trialEndsAt).toLocaleDateString('es-VE')}</div>}{p.subscriptionStatus==='ACTIVO'&&p.renewalDueAt&&<div className="muted" style={{fontSize:12}}>Próxima renovación aproximada: {new Date(p.renewalDueAt).toLocaleDateString('es-VE')}</div>}</div></div><div className="row" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{p.subscriptionStatus==='ACTIVO'?'Cuenta activa':p.subscriptionStatus==='SUSPENDIDO'?'Cuenta suspendida':p.subscriptionStatus==='REVISION_BINANCE'?'Pago en revisión':'Prueba gratis'}</span>{p.clientId&&p.subscriptionStatus!=='ACTIVO'&&<Link className="btn btn-primary" href={'/pago?client='+p.clientId}>Activar / pagar</Link>}{p.clientId&&p.subscriptionStatus==='ACTIVO'&&<Link className="btn btn-secondary" href={'/pago?client='+p.clientId}>Renovación</Link>}<Link className="btn btn-secondary" href="/scan"><ScanLine size={16}/> Leer QR</Link><button className="btn btn-secondary" onClick={()=>setModal('profile')}><UserRound size={16}/> Perfil</button></div></div>

  {p.subscriptionStatus==='ACTIVO'&&<section className="panel" style={{marginBottom:18,border:'1px solid #7dd3c7',background:'linear-gradient(135deg,#f0fdfa,#ffffff)'}}>
    <div className="row space" style={{gap:16,flexWrap:'wrap'}}>
      <div style={{minWidth:0,flex:1}}>
        <span className="eyebrow"><CheckCircle2 size={15}/> CUENTA ACTIVA</span>
        <h2 style={{margin:'10px 0 6px'}}>Tu enlace para recibir clientes</h2>
        <p className="muted" style={{margin:'0 0 10px'}}>Este es el enlace que debes enviar por WhatsApp, Instagram, redes sociales o colocar en tu perfil.</p>
        <div className="notice" style={{wordBreak:'break-all'}}><strong>{publicUrl}</strong></div>
      </div>
      <div className="button-row" style={{flexWrap:'wrap'}}>
        <button className="btn btn-primary" onClick={copy}><Link2 size={16}/> Copiar enlace</button>
        <button className="btn btn-secondary" onClick={share}><Share2 size={16}/> Compartir</button>
        <a className="btn btn-secondary" href={publicPath} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Ver mi página</a>
      </div>
    </div>
  </section>}

  <div className="stat-grid">
    <div className="stat"><small>Reservas activas</small><div className="n">{confirmed.length}</div></div>
    <div className="stat"><small>Pagos por revisar</small><div className="n">{review.length}</div></div>
    <div className="stat"><small>Servicios</small><div className="n">{data.services.filter((s:any)=>s.active).length}</div></div>
    <div className="stat"><small>Bloques disponibles</small><div className="n">{data.availability.length}</div></div>
  </div>

  {nextAppointment&&<section className="panel" style={{marginTop:18,background:'linear-gradient(145deg,#ffffff,#eef9f6)'}}>
    <div className="row space" style={{gap:16,alignItems:'flex-start',flexWrap:'wrap'}}><div><span className="eyebrow"><Clock3 size={15}/> SIGUIENTE CITA</span><h2 style={{fontSize:24,margin:'10px 0 4px'}}>{nextAppointment.clientName}</h2><div className="muted">{nextAppointment.serviceName}</div><div style={{marginTop:9}}><strong>{new Date(nextAppointment.startsAt).toLocaleString('es-VE',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'America/Caracas'})}</strong></div><div className="row muted" style={{fontSize:12,marginTop:7}}><MapPin size={14}/>{[nextAppointment.location?.name,nextAppointment.location?.address].filter(Boolean).join(' · ')||'Ubicación por confirmar'}</div></div><div className="button-row"><Link className="btn btn-secondary" href="/medico/finanzas">Ver finanzas</Link>{nextAppointment.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>patch({action:'appointment_status',id:nextAppointment.id,status:'ARRIVED'})}>Registrar llegada</button>}</div></div>
  </section>}

  <section className="panel" id="ubicaciones" style={{marginTop:18}}>
   <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Lugares de atención</h2><div className="muted" style={{fontSize:13}}>Agrega todos los lugares donde trabajas. Luego asigna cada horario a uno de ellos.</div></div><button className="btn btn-primary" onClick={newLocation}><Plus size={16}/> Agregar ubicación</button></div>
   {!data.locations?.length?<div className="notice" style={{marginTop:14}}>Agrega al menos una ubicación para publicar horarios.</div>:<div className="grid-3" style={{marginTop:14}}>{data.locations.map((l:any)=><div className="card" key={l.id}><MapPin size={18}/><h3>{l.name}</h3><p>{[l.address,l.city,l.state,l.country].filter(Boolean).join(' · ')||'Dirección por completar'}{l.room?<><br/><strong>{l.room}</strong></>:null}</p>{mapQuery(l)&&<a className="btn btn-secondary" style={{marginBottom:10}} href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(l))} target="_blank" rel="noreferrer"><Navigation size={15}/> Ver mapa</a>}<div className="row" style={{gap:8,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>editLocation(l)}><Pencil size={15}/> Editar</button><button className="btn btn-secondary" onClick={()=>patch({action:'delete_location',id:l.id})}><Trash2 size={15}/> Eliminar</button></div></div>)}</div>}
  </section>

  <section className="panel" id="agenda" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}>
      <div><h2>Calendario de disponibilidad</h2><div className="muted" style={{fontSize:13}}>Publica exactamente qué días y horas puedes atender. El cliente solo verá horas libres.</div></div>
      <button className="btn btn-primary" onClick={openAvailability}><CalendarPlus size={16}/> Agregar día y horario</button>
    </div>
    {data.availability.length===0?<div className="notice" style={{marginTop:14}}>Todavía no has publicado disponibilidad. Agrega una fecha, hora de inicio y hora de cierre.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.availability.map((a:any)=><div className="card" key={a.id}>
      <CalendarPlus size={18}/><h3>{new Date(a.startsAt).toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long',timeZone:'America/Caracas'})}</h3>
      <p><strong>{new Date(a.startsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong> a <strong>{new Date(a.endsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong></p>
      <div className="notice" style={{margin:'10px 0'}}><MapPin size={15}/> <strong>Atención en {a.location?.name||'ubicación por confirmar'}</strong><br/><span className="muted">{[a.location?.address,a.location?.city,a.location?.state,a.location?.country].filter(Boolean).join(' · ')}{a.location?.room?' · '+a.location.room:''}</span></div><div className="muted" style={{fontSize:12}}>Inicios cada {a.slotMinutes} min. TUCITA adapta el espacio a la duración real del servicio.</div>
      <button className="btn btn-secondary" style={{marginTop:12}} disabled={saving} onClick={()=>patch({action:'delete_availability',id:a.id})}><Trash2 size={15}/> Eliminar horario</button>
    </div>)}</div>}
    <div className="notice" style={{marginTop:14}}><strong>Ejemplo:</strong> si publicas 9:00–13:00 y un corte dura 30 minutos, TUCITA ofrece horas que permitan completar esos 30 minutos. Si “Corte + barba” dura 45 minutos, recalcula automáticamente las horas disponibles.</div>
  </section>

  <section className="panel" id="servicios" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Servicios, duración y precio</h2><div className="muted" style={{fontSize:13}}>{serviceHint}</div></div><button className="btn btn-primary" onClick={newService}><Plus size={16}/> Nuevo servicio</button></div>
    {data.services.length===0?<div className="notice" style={{marginTop:14}}>Agrega al menos un servicio para que tus clientes puedan reservar.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.services.map((s:any)=><div className="card" key={s.id}><BriefcaseBusiness size={18}/><h3>{s.name}</h3><p>{s.description||'Sin descripción'}</p><div className="row space"><strong>{s.currency} {s.price}</strong><span className="pill">{s.durationMinutes} min</span></div><div className="row" style={{gap:8,marginTop:12,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>editService(s)}><Pencil size={15}/> Editar</button><button className="btn btn-secondary" disabled={saving} onClick={()=>patch({action:'update_service',id:s.id,active:!s.active})}>{s.active?'Pausar':'Activar'}</button></div></div>)}</div>}
  </section>

  <div className="panel-grid" style={{marginTop:18}}>
   <section className="panel">
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Reservas y pagos</h2><div className="muted" style={{fontSize:13}}>Cada reserva conserva el servicio, su duración y el precio elegido por el cliente.</div></div></div>
    {upcoming.length===0?<div className="notice" style={{marginTop:14}}>Todavía no tienes reservas reales. Comparte tu enlace para comenzar.</div>:
    <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{upcoming.map((a:any)=><tr key={a.id}>
      <td><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.clientEmail} · {a.clientPhone}</div></td>
      <td>{a.serviceName}<div className="muted" style={{fontSize:12}}>{a.currency} {a.price}</div></td>
      <td>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}<div className="muted" style={{fontSize:12,marginTop:4}}><MapPin size={12}/> {a.location?.name||'Ubicación'}</div></td>
      <td>{a.paymentMethod||'—'}{a.paymentReference&&<div><strong>Ref: {a.paymentReference}</strong></div>}{a.paymentProofUrl&&<a className="btn btn-secondary" style={{marginTop:6,padding:'6px 9px'}} target="_blank" rel="noreferrer" href={a.paymentProofUrl}><Eye size={14}/> Ver</a>}</td>
      <td><StatusPill tone={a.status==='PAYMENT_REVIEW'?'warn':a.status==='PAYMENT_REJECTED'?'bad':['CONFIRMED','COMPLETED','ARRIVED','IN_CONSULTATION'].includes(a.status)?'ok':''}>{labels[a.status]||a.status}</StatusPill></td>
      <td><div className="row" style={{gap:6,flexWrap:'wrap'}}>
       {a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'approve_payment',id:a.id})}>Aprobar</button><button className="btn btn-secondary" disabled={saving} onClick={()=>patch({action:'reject_payment',id:a.id})}>Rechazar</button></>}
       {a.status==='CONFIRMED'&&<button className="btn btn-secondary" disabled={saving} onClick={()=>patch({action:'appointment_status',id:a.id,status:'ARRIVED'})}>Llegó</button>}
       {a.status==='ARRIVED'&&<button className="btn btn-secondary" disabled={saving} onClick={()=>patch({action:'appointment_status',id:a.id,status:'IN_CONSULTATION'})}>Atender</button>}
       {a.status==='IN_CONSULTATION'&&<button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'appointment_status',id:a.id,status:'COMPLETED'})}>Completar</button>}
       {a.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)&&<a className="btn btn-secondary" href={'/api/appointments/'+a.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={14}/> Recibo</a>}
       {a.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)&&a.clientEmail&&<button className="btn btn-secondary" disabled={saving} onClick={()=>patch({action:'resend_receipt_email',id:a.id})}>Reenviar al correo</button>}
      </div></td>
    </tr>)}</tbody></table></div>}
   </section>

   <aside style={{display:'grid',gap:18}}>
    <section className="panel"><h2>Tu página pública</h2><div className="notice"><strong>{p.name}</strong><br/>{p.activity} · {p.category}<br/>{[p.location?.city,p.location?.state,p.location?.country].filter(Boolean).join(' · ')||'Ubicación por configurar'}<br/><span style={{wordBreak:'break-all',fontSize:12}}>{publicUrl}</span></div><div className="quick-grid" style={{marginTop:12}}><button className="quick" onClick={copy}><Link2 size={18}/><strong>Copiar enlace</strong><small>{publicPath}</small></button><button className="quick" onClick={share}><Share2 size={18}/><strong>Compartir</strong><small>Enviar a clientes</small></button></div><a className="btn btn-secondary" href={publicPath} target="_blank" rel="noreferrer" style={{marginTop:12}}><ExternalLink size={15}/> Abrir mi página pública</a></section>
    <section className="panel"><h2>Estado de atención</h2><div className="muted" style={{fontSize:13,marginBottom:10}}>{p.dayStatus==='DELAYED'?'Retraso de '+p.delayMinutes+' min':p.dayStatus==='SUSPENDED'?'Atención suspendida':'Atendiendo normalmente'}</div><button className="btn btn-secondary" onClick={()=>setModal('status')}>Cambiar estado</button></section>
   </aside>
  </div>

  <section className="panel" id="pagos" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>Configura cómo te pagarán tus clientes.</div></div><button className="btn btn-secondary" onClick={()=>setModal('settings')}><Settings2 size={16}/> Configuración</button></div>
    <PaymentMethodsManager scope="DOCTOR" slug={p.slug}/>
  </section>
 </main>

 {modal==='profile'&&<div className="modal-backdrop"><div className="modal profile-modal"><div className="profile-modal-scroll"><h2>Editar perfil</h2><div className="form">
   <div className="field"><label>Foto de perfil</label><div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>{profile.profileImage?<img src={profile.profileImage} alt="Vista previa" style={{width:82,height:82,borderRadius:22,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:82,height:82}}><UserRound size={30}/></div>}<label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> {profile.profileImage?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>profileImageChange(e.target.files?.[0])}/></label>{profile.profileImage&&<button type="button" className="btn btn-secondary" onClick={()=>setProfile({...profile,profileImage:''})}><Trash2 size={15}/> Quitar</button>}</div><small className="muted">TUCITA la recorta automáticamente en formato cuadrado para que nunca se deforme.</small></div>
   <div className="field"><label>Nombre visible</label><input value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})}/></div>
   <div className="field"><label>Teléfono / WhatsApp</label><div className="register-phone-row"><select aria-label="País del teléfono" value={profile.phoneCountry||'Venezuela'} onChange={e=>setProfile({...profile,phoneCountry:e.target.value,phoneLocal:''})}>{COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.country}>{x.country} ({x.code})</option>)}</select><div className="register-phone-number"><span>{countryDialCode(profile.phoneCountry||'Venezuela')}</span><input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={phoneMaxLength(countryDialCode(profile.phoneCountry||'Venezuela'))} value={profile.phoneLocal||''} onChange={e=>setProfile({...profile,phoneLocal:digitsOnly(e.target.value,phoneMaxLength(countryDialCode(profile.phoneCountry||'Venezuela')))})} placeholder="Número nacional"/></div></div><small className="muted">Solo números. Para Venezuela, máximo 11 dígitos; el +58 se agrega automáticamente.</small></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
     <div className="field" style={{flex:1,minWidth:180}}><label>Cédula / documento (opcional)</label><input value={profile.nationalId||''} disabled={!p.personalFieldsReady} maxLength={32} autoComplete="off" placeholder="Ej. V-12345678" onChange={e=>setProfile({...profile,nationalId:e.target.value})}/></div>
     <div className="field" style={{flex:1,minWidth:180}}><label>Fecha de nacimiento (opcional)</label><input type="date" value={profile.birthDate||''} disabled={!p.personalFieldsReady} max={new Date().toISOString().slice(0,10)} onChange={e=>setProfile({...profile,birthDate:e.target.value})}/></div>
   </div>
   {p.personalFieldsReady?<div className="muted" style={{fontSize:12}}>Estos datos son privados y no aparecen en tu página pública.</div>:<div className="notice">Los datos personales estarán disponibles después de actualizar la base de datos de perfiles.</div>}
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:200}}><label>Rubro</label><input value={profile.category||''} onChange={e=>setProfile({...profile,category:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:200}}><label>Actividad</label><input value={profile.activity||''} onChange={e=>setProfile({...profile,activity:e.target.value})}/></div></div>
   <div className="field"><label>Tipo</label><select value={profile.type||'Profesional independiente'} onChange={e=>setProfile({...profile,type:e.target.value})}><option>Profesional independiente</option><option>Negocio / local</option></select></div>
   {categoryUsesWorkReferences(profile.category||p.category,profile.activity||p.activity)&&<div className="field"><label>Referencias de trabajos</label><div className="muted" style={{fontSize:12,marginBottom:8}}>Puedes mostrar hasta 4 mini fotos. TUCITA las ajusta sin deformarlas.</div><div className="row" style={{gap:8,flexWrap:'wrap'}}>{(profile.workImages||[]).map((img:string,i:number)=><div key={i} style={{position:'relative'}}><img src={img} alt={'Trabajo '+(i+1)} style={{width:112,height:76,borderRadius:12,objectFit:'cover'}}/><button type="button" onClick={()=>setProfile({...profile,workImages:(profile.workImages||[]).filter((_:string,j:number)=>j!==i)})} aria-label="Quitar foto" style={{position:'absolute',top:4,right:4,border:0,borderRadius:999,width:24,height:24,cursor:'pointer'}}><X size={14}/></button></div>)}{(profile.workImages||[]).length<4&&<label className="btn btn-secondary" style={{cursor:'pointer',height:76}}><ImagePlus size={16}/> Agregar<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>workImageChange(e.target.files?.[0])}/></label>}</div></div>}
   <div className="field"><label>Nombre de ubicación</label><input value={profile.locationName||''} onChange={e=>setProfile({...profile,locationName:e.target.value})}/></div>
   <div className="field"><label>Dirección</label><input value={profile.address||''} onChange={e=>setProfile({...profile,address:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Ciudad</label><input value={profile.city||''} onChange={e=>setProfile({...profile,city:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>Estado / Provincia</label><input value={profile.state||''} onChange={e=>setProfile({...profile,state:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>País</label><input list="profile-countries" value={profile.country||''} onChange={e=>setProfile({...profile,country:e.target.value})}/><datalist id="profile-countries">{COUNTRY_SUGGESTIONS.map(x=><option key={x} value={x}/>)}</datalist></div></div>
 </div></div><div className="button-row profile-modal-actions"><button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'profile',...profile})}>{saving?'Guardando…':'Guardar perfil'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='service'&&<div className="modal-backdrop"><div className="modal"><h2>{service.id?'Editar servicio':'Nuevo servicio'}</h2><div className="form">
   <div className="notice">{serviceHint}</div>
   <div className="field"><label>Nombre del servicio</label><input value={service.name} onChange={e=>setService({...service,name:e.target.value})} placeholder={activity.includes('barber')?'Ej. Corte + barba':activity.includes('manicur')?'Ej. Acrílicas':'Ej. Consulta / Servicio premium'}/></div>
   <div className="field"><label>Descripción</label><textarea rows={3} value={service.description} onChange={e=>setService({...service,description:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:150}}><label>Duración real</label><select value={service.durationMinutes} onChange={e=>setService({...service,durationMinutes:Number(e.target.value)})}><option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={75}>75 min</option><option value={90}>90 min</option><option value={120}>120 min</option><option value={180}>180 min</option></select></div><div className="field" style={{flex:1,minWidth:150}}><label>Precio</label><input type="number" min="0" step="0.01" value={service.price} onChange={e=>setService({...service,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:120}}><label>Moneda</label><select value={service.currency} onChange={e=>setService({...service,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>{fxPreview(Number(service.price||0),service.currency||'USD')}
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving} onClick={saveService}>{saving?'Guardando…':service.id?'Guardar cambios':'Agregar servicio'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='location'&&<div className="modal-backdrop"><div className="modal"><h2>{locationForm.id?'Editar ubicación':'Nueva ubicación'}</h2><div className="form">
   <div className="field"><label>Nombre visible</label><input value={locationForm.name} onChange={e=>setLocationForm({...locationForm,name:e.target.value})} placeholder="Ej. Clínica X / Sede Centro / Consultorio privado"/></div>
   <div className="field"><label>Dirección exacta</label><input value={locationForm.address} onChange={e=>setLocationForm({...locationForm,address:e.target.value})} placeholder="Ej. Av. Principal, Edif. Centro Médico, Torre B, local 204"/><small className="muted">Escribe calle/avenida, edificio o centro comercial y número/local. Esta dirección será usada para mostrarle al cliente cómo llegar.</small></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:170}}><label>Ciudad</label><input value={locationForm.city} onChange={e=>setLocationForm({...locationForm,city:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:170}}><label>Estado / Provincia</label><input value={locationForm.state} onChange={e=>setLocationForm({...locationForm,state:e.target.value})}/></div></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:170}}><label>País</label><input list="location-countries" value={locationForm.country} onChange={e=>setLocationForm({...locationForm,country:e.target.value})}/><datalist id="location-countries">{COUNTRY_SUGGESTIONS.map(x=><option key={x} value={x}/>)}</datalist></div><div className="field" style={{flex:1,minWidth:170}}><label>Consultorio / local / referencia</label><input value={locationForm.room} onChange={e=>setLocationForm({...locationForm,room:e.target.value})} placeholder="Ej. Piso 2 · Consultorio 204"/></div></div>
   {mapQuery(locationForm)&&<div className="field"><label>Vista previa del mapa</label><div style={{border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}><iframe title="Vista previa de ubicación" src={'https://www.google.com/maps?q='+encodeURIComponent(mapQuery(locationForm))+'&output=embed'} width="100%" height="220" style={{border:0,display:'block'}} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div><div className="row" style={{marginTop:8,gap:8,flexWrap:'wrap'}}><a className="btn btn-secondary" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(locationForm))} target="_blank" rel="noreferrer"><Navigation size={15}/> Comprobar en Google Maps</a><span className="muted" style={{fontSize:12}}>Verifica que el pin corresponda al lugar real antes de guardar.</span></div></div>}
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving} onClick={saveLocation}>{saving?'Guardando…':'Guardar ubicación'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='availability'&&<div className="modal-backdrop"><div className="modal"><h2>Agregar disponibilidad</h2><div className="form">
   <div className="field"><label>¿Dónde atenderás en este horario?</label><select value={av.locationId} onChange={e=>setAv({...av,locationId:e.target.value})}><option value="">Selecciona una ubicación</option>{(data.locations||[]).map((l:any)=><option key={l.id} value={l.id}>{l.name}{l.room?' · '+l.room:''}</option>)}</select></div>
   <div className="field"><label>Día disponible</label><input type="date" value={av.date} onChange={e=>setAv({...av,date:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:150}}><label>Disponible desde</label><input type="time" value={av.start} onChange={e=>setAv({...av,start:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:150}}><label>Disponible hasta</label><input type="time" value={av.end} onChange={e=>setAv({...av,end:e.target.value})}/></div></div>
   <div className="field"><label>Cada cuánto puede comenzar una reserva</label><select value={av.slotMinutes} onChange={e=>setAv({...av,slotMinutes:Number(e.target.value)})}><option value={10}>Cada 10 min</option><option value={15}>Cada 15 min</option><option value={20}>Cada 20 min</option><option value={30}>Cada 30 min</option><option value={45}>Cada 45 min</option><option value={60}>Cada 60 min</option></select></div>
   <div className="notice">La duración no se fija aquí. La duración viene de cada servicio. Por ejemplo: corte 30 min, corte + barba 45 min, acrílicas 90 min.</div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'add_availability',...av})}><Clock3 size={16}/> Publicar horario</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='settings'&&<div className="modal-backdrop"><div className="modal"><h2>Configuración de reservas</h2><div className="form">
   <div className="row" style={{gap:12,alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Precio base</label><input type="number" value={settings.price??0} onChange={e=>setSettings({...settings,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1}}><label>Moneda</label><select value={settings.currency||'USD'} onChange={e=>setSettings({...settings,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>{fxPreview(Number(settings.price||0),settings.currency||'USD')}
   <div className="field"><label>Duración predeterminada</label><input type="number" value={settings.defaultMinutes||30} onChange={e=>setSettings({...settings,defaultMinutes:Number(e.target.value)})}/></div>
   <div className="field"><label>Instrucciones de pago</label><textarea rows={4} value={settings.paymentInstructions||''} onChange={e=>setSettings({...settings,paymentInstructions:e.target.value})}/></div>
   <label className="notice row"><input type="checkbox" checked={settings.acceptsOnlineBooking!==false} onChange={e=>setSettings({...settings,acceptsOnlineBooking:e.target.checked})}/><span>Aceptar reservas en línea</span></label>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'settings',...settings})}>Guardar</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='status'&&<div className="modal-backdrop"><div className="modal"><h2>Estado de atención</h2><div className="form">
   <div className="field"><label>Estado</label><select value={dayStatus.status} onChange={e=>setDayStatus({...dayStatus,status:e.target.value})}><option value="NORMAL">Normal</option><option value="DELAYED">Retrasado</option><option value="SUSPENDED">Suspendido</option></select></div>
   {dayStatus.status==='DELAYED'&&<div className="field"><label>Minutos de retraso</label><input type="number" value={dayStatus.delayMinutes} onChange={e=>setDayStatus({...dayStatus,delayMinutes:Number(e.target.value)})}/></div>}
   <div className="field"><label>Nota opcional</label><input value={dayStatus.note} onChange={e=>setDayStatus({...dayStatus,note:e.target.value})}/></div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving} onClick={()=>patch({action:'day_status',...dayStatus})}>{saving?'Guardando…':'Guardar estado'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {toast&&<div className="toast">{toast}</div>}
 </div>
}
