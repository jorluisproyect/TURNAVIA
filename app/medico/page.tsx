'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarPlus, Clock3, Link2, Share2, Settings2, Eye, Plus, UserRound, BriefcaseBusiness, Pencil, Trash2, ExternalLink, CheckCircle2, MapPin, ScanLine, FileText, ImagePlus, X, Navigation } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
import { COUNTRY_SUGGESTIONS, COUNTRY_PHONE_CODES, PROVIDER_CATEGORIES } from '@/lib/provider-catalog';
import { categoryUsesWorkReferences } from '@/lib/provider-media';
import { countryDialCode, digitsOnly, phoneMaxLength } from '@/lib/phone';
import { DeleteProfileButton } from '@/components/DeleteProfileButton';
import { isTravelProvider } from '@/lib/travel-service';

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
function usesProfessionalCredentials(category?:string,activity?:string){
 const text=(String(category||'')+' '+String(activity||'')).toLowerCase();
 return ['salud','médico','medico','odont','psicolog','fisioter','nutric','veterin','legal','abogad','derecho','jurídic','juridic'].some(x=>text.includes(x));
}


export default function Medico(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [toast,setToast]=useState('');
 const [saving,setSaving]=useState(false);
 const savingRef=useRef(false);
 const [origin,setOrigin]=useState('');
 const [modal,setModal]=useState<'profile'|'availability'|'settings'|'service'|'status'|'location'|null>(null);
 const [profile,setProfile]=useState<any>({});
 const [settings,setSettings]=useState<any>({});
 const [paymentReminder,setPaymentReminder]=useState(false);
 const emptyService={id:'',name:'',description:'',summary:'',durationMinutes:30,price:'',currency:'USD',childPrice:'',serviceImage:'',travelImage:'',travelDate:'',departureTime:'',returnTime:'',locationId:'',capacity:''};
 const [service,setService]=useState<any>(emptyService);
 const [av,setAv]=useState({date:'',start:'08:00',end:'12:00',locationId:''});
 const [locationForm,setLocationForm]=useState({id:'',name:'',address:'',city:'',state:'',country:'Venezuela',room:''});
 const [dayStatus,setDayStatus]=useState({status:'NORMAL',delayMinutes:0,note:''});
 const [fx,setFx]=useState<any>(null);

 const load=()=>fetch('/api/me/provider').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
   if(!ok){setError(j.error||'No se pudo abrir tu panel');return}
   setData(j);setError('');
   const phoneParts=splitPhone(j.provider.phone||'');
   setProfile({name:j.provider.name,phoneCountry:phoneParts.country,phoneLocal:phoneParts.local,nationalId:j.provider.nationalId||'',birthDate:j.provider.birthDate||'',category:j.provider.category,activity:j.provider.activity,type:j.provider.type,profileImage:j.provider.profileImage||'',workImages:j.provider.workImages||[],licenseNumber:j.provider.licenseNumber||'',locationName:j.provider.location?.name||'',address:j.provider.location?.address||'',city:j.provider.location?.city||'',state:j.provider.location?.state||'',country:j.provider.location?.country||'Venezuela'});
   setSettings({price:j.provider.price,currency:j.provider.currency,paymentInstructions:j.provider.paymentInstructions,defaultMinutes:j.provider.defaultMinutes,acceptsOnlineBooking:j.provider.acceptsOnlineBooking});
   setDayStatus({status:j.provider.dayStatus,delayMinutes:j.provider.delayMinutes,note:''});
 }).catch(()=>setError('No se pudo conectar con TUCITA.'));

 useEffect(()=>{load();setOrigin(window.location.origin);fetch('/api/fx').then(r=>r.json()).then(setFx).catch(()=>{})},[]);
 const upcoming=useMemo(()=>data?.appointments?.filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-86400000)||[],[data]);
 const review=useMemo(()=>upcoming.filter((a:any)=>a.status==='PAYMENT_REVIEW'),[upcoming]);
 const confirmed=useMemo(()=>upcoming.filter((a:any)=>['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION'].includes(a.status)),[upcoming]);
 const nextAppointment=useMemo(()=>[...confirmed].filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-3600000).sort((a:any,b:any)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime())[0],[confirmed]);

 async function patch(body:any){
   if(savingRef.current)return false;
   savingRef.current=true;setSaving(true);setToast('Guardando cambios…');
   try{
     const r=await fetch('/api/me/provider',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
     const j=await r.json();
     if(!r.ok){setToast(j.error||'No se pudieron guardar los cambios.');return false}
     setModal(null);setToast(j.message||'Cambios guardados correctamente.');await load();setTimeout(()=>setToast(''),2800);return true;
   }catch{
     setToast('No se pudo conectar con TUCITA. Intenta nuevamente.');return false;
   }finally{
     savingRef.current=false;setSaving(false);
   }
 }
 async function profileImageChange(file?:File){
   if(!file)return;
   try{const dataUrl=await resizeImage(file,256,256,.75);setProfile((x:any)=>({...x,profileImage:dataUrl}));}
   catch(e:any){setToast(e?.message||'No se pudo procesar la imagen.')}
 }
 async function workImageChange(file?:File){
   if(!file)return;
   if((profile.workImages||[]).length>=4){setToast(usesProfessionalCredentials(profile.category,profile.activity)?'Puedes cargar hasta 4 certificaciones o credenciales.':'Puedes cargar hasta 4 fotos de referencia.');return}
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

 async function saveAvailability(){
   if(!av.locationId||!av.date||!av.start||!av.end){
     setToast('Completa lugar, día, hora inicial y hora final.');
     return;
   }
   const start=new Date(`${av.date}T${av.start}:00-04:00`);
   const end=new Date(`${av.date}T${av.end}:00-04:00`);
   if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start){
     setToast('La hora final debe ser posterior a la hora inicial.');
     return;
   }
   const exact=(data?.availability||[]).some((x:any)=>
     x.location?.id===av.locationId &&
     new Date(x.startsAt).getTime()===start.getTime() &&
     new Date(x.endsAt).getTime()===end.getTime()
   );
   if(exact){
     setToast('Este bloque ya está publicado. No puedes agregar el mismo horario dos veces.');
     return;
   }
   const overlap=(data?.availability||[]).find((x:any)=>
     new Date(x.startsAt).getTime()<end.getTime() &&
     new Date(x.endsAt).getTime()>start.getTime()
   );
   if(overlap){
     const from=new Date(overlap.startsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
     const to=new Date(overlap.endsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
     setToast('Ese horario se cruza con otro bloque ya publicado ('+from+'–'+to+').');
     return;
   }
   await patch({action:'add_availability',...av});
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
   setService({...emptyService});
   setModal('service');
 }
 function editService(s:any){
   setService({
     ...emptyService,
     id:s.id,
     name:s.name,
     description:s.description||'',
     summary:s.summary||String(s.description||'').slice(0,180),
     durationMinutes:Number(s.durationMinutes||30),
     price:Number(s.price||0),
     currency:s.currency||'USD',
     childPrice:s.childPrice===null||s.childPrice===undefined?'':Number(s.childPrice),
     serviceImage:s.serviceImage||'',
     travelImage:s.travelImage||'',
     travelDate:s.travelDate||'',
     departureTime:s.departureTime||'',
     returnTime:s.returnTime||'',
     locationId:s.locationId||data?.locations?.[0]?.id||'',
     capacity:Number(s.capacity||1)
   });
   setModal('service');
 }
 async function serviceImageChange(file?:File){
   if(!file)return;
   try{
     const dataUrl=await resizeImage(file,520,360,.68);
     setService((x:any)=>({...x,serviceImage:dataUrl}));
   }catch(e:any){setToast(e?.message||'No se pudo procesar la foto del servicio.')}
 }
 async function travelImageChange(file?:File){
   if(!file)return;
   try{
     const dataUrl=await resizeImage(file,640,400,.68);
     setService((x:any)=>({...x,travelImage:dataUrl}));
   }catch(e:any){setToast(e?.message||'No se pudo procesar la foto del viaje.')}
 }
 async function saveService(){
   const travel=isTravelProvider(data?.provider?.category,data?.provider?.activity);
   if(travel){
     if(!String(service.summary||'').trim()){setToast('Escribe una descripción corta para la tarjeta del viaje.');return}
     if(!String(service.travelDate||'').trim()){setToast('Selecciona la fecha de salida del viaje.');return}
     if(!String(service.departureTime||'').trim()){setToast('Indica la hora de salida del viaje.');return}
     if(Number(service.capacity||0)<1){setToast('Indica al menos 1 cupo disponible.');return}
     if(service.returnTime){
       const [sh,sm]=String(service.departureTime).split(':').map(Number);
       const [eh,em]=String(service.returnTime).split(':').map(Number);
       let minutes=(eh*60+em)-(sh*60+sm);
       if(minutes<=0)minutes+=24*60;
       setService((x:any)=>({...x,durationMinutes:minutes}));
       service.durationMinutes=minutes;
     }
   }
   const wasNew=!service.id;
   const action=service.id?'update_service':'add_service';
   const ok=await patch({action,...service});
   if(ok){
     setService({...emptyService});
     if(wasNew&&data?.provider?.slug){
       try{
         const r=await fetch('/api/payment-methods?scope=DOCTOR&slug='+encodeURIComponent(data.provider.slug));
         const j=await r.json();
         const active=(j.methods||[]).some((m:any)=>m.active!==false);
         if(!active)setPaymentReminder(true);
       }catch{
         setPaymentReminder(true);
       }
     }
   }
 }

 if(error&&!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><section className="panel"><h1>Tu panel profesional</h1><div className="notice danger">{error}</div></section></main></div>;
 if(!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main">Cargando tu cuenta…</main></div>;
 const p=data.provider;
 const publicPath=p.publicPath||('/reservar/'+p.slug);
 const publicUrl=(origin||'https://tucita.com.ve')+publicPath;
 const activity=String(p.activity||'').toLowerCase();
 const referencesEnabled=categoryUsesWorkReferences(p.category,p.activity);
 const credentialMode=usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity);
 const travelMode=isTravelProvider(p.category,p.activity);
 const serviceHint=travelMode?'Crea cada salida como un viaje independiente: foto, fecha, horario, duración y precio.':activity.includes('barber')?'Ej.: Corte clásico, Fade, Corte + barba, Barba completa':activity.includes('manicur')||activity.includes('uña')?'Ej.: Manicura, Semipermanente, Acrílicas, Jelly, Nail art, Retiro, Mantenimiento':'Crea cada servicio por separado con su duración y precio.';

 return <div className="dashboard"><Sidebar role="medico"/><main className="main">
  <div id="perfil" className="topbar"><div className="row" style={{gap:12,alignItems:'center'}}>{p.profileImage?<img src={p.profileImage} alt="" style={{width:54,height:54,borderRadius:18,objectFit:'cover',flex:'0 0 auto'}}/>:<div className="profile-avatar" style={{width:54,height:54}}><UserRound size={24}/></div>}<div><div className="muted" style={{fontSize:13}}>{p.category} · {p.activity}</div><h1>Hola, {p.name}</h1>{p.subscriptionStatus==='TRIAL'&&p.trialEndsAt&&<div className="muted" style={{fontSize:12}}>Prueba disponible hasta {new Date(p.trialEndsAt).toLocaleDateString('es-VE')}</div>}{p.subscriptionStatus==='ACTIVO'&&p.renewalDueAt&&<div className="muted" style={{fontSize:12}}>Próxima renovación aproximada: {new Date(p.renewalDueAt).toLocaleDateString('es-VE')}</div>}</div></div><div className="row" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{p.subscriptionStatus==='ACTIVO'?'Cuenta activa':p.subscriptionStatus==='SUSPENDIDO'?'Cuenta suspendida':p.subscriptionStatus==='REVISION_BINANCE'?'Pago en revisión':'Prueba gratis'}</span>{p.clientId&&p.subscriptionStatus!=='ACTIVO'&&<Link className="btn btn-primary" href={'/pago?client='+p.clientId}>Activar / pagar</Link>}{p.clientId&&p.subscriptionStatus==='ACTIVO'&&<Link className="btn btn-secondary" href={'/pago?client='+p.clientId}>Renovación</Link>}<button className="btn btn-primary" onClick={share}><Share2 size={16}/> Compartir mi link</button><button className="btn btn-secondary" onClick={copy}><Link2 size={16}/> Copiar link</button><Link className="btn btn-secondary" href="/scan"><ScanLine size={16}/> Leer QR</Link><button className="btn btn-secondary" onClick={()=>setModal('profile')}><UserRound size={16}/> Perfil</button></div></div>

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
    <div className="stat"><small>{travelMode?'Viajes publicados':'Bloques disponibles'}</small><div className="n">{travelMode?data.services.filter((s:any)=>s.active&&s.travelDate).length:data.availability.length}</div></div>
  </div>

  {nextAppointment&&<section className="panel" style={{marginTop:18,background:'linear-gradient(145deg,#ffffff,#eef9f6)'}}>
    <div className="row space" style={{gap:16,alignItems:'flex-start',flexWrap:'wrap'}}><div><span className="eyebrow"><Clock3 size={15}/> SIGUIENTE CITA</span><h2 style={{fontSize:24,margin:'10px 0 4px'}}>{nextAppointment.clientName}</h2><div className="muted">{nextAppointment.serviceName}</div><div style={{marginTop:9}}><strong>{new Date(nextAppointment.startsAt).toLocaleString('es-VE',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit',timeZone:'America/Caracas'})}</strong></div><div className="row muted" style={{fontSize:12,marginTop:7}}><MapPin size={14}/>{[nextAppointment.location?.name,nextAppointment.location?.address].filter(Boolean).join(' · ')||'Ubicación por confirmar'}</div></div><div className="button-row"><Link className="btn btn-secondary" href="/medico/finanzas">Ver finanzas</Link>{nextAppointment.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>patch({action:'appointment_status',id:nextAppointment.id,status:'ARRIVED'})} disabled={saving}>{saving?'Procesando…':'Registrar llegada'}</button>}</div></div>
  </section>}

  {!travelMode&&<>
  <section className="panel" id="ubicaciones" style={{marginTop:18}}>
   <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>{travelMode?'Puntos de salida / encuentro':'Lugares de atención'}</h2><div className="muted" style={{fontSize:13}}>{travelMode?'Agrega los puntos desde donde parten tus viajes. Luego selecciona uno al crear cada viaje.':'Agrega todos los lugares donde trabajas. Luego asigna cada horario a uno de ellos.'}</div></div><button className="btn btn-primary" onClick={newLocation}><Plus size={16}/> {travelMode?'Agregar punto':'Agregar ubicación'}</button></div>
   {!data.locations?.length?<div className="notice" style={{marginTop:14}}>{travelMode?'Agrega al menos un punto de salida para publicar viajes.':'Agrega al menos una ubicación para publicar horarios.'}</div>:<div className="grid-3" style={{marginTop:14}}>{data.locations.map((l:any)=><div className="card" key={l.id}><MapPin size={18}/><h3>{l.name}</h3><p>{[l.address,l.city,l.state,l.country].filter(Boolean).join(' · ')||'Dirección por completar'}{l.room?<><br/><strong>{l.room}</strong></>:null}</p>{mapQuery(l)&&<a className="btn btn-secondary" style={{marginBottom:10}} href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(l))} target="_blank" rel="noreferrer"><Navigation size={15}/> Ver mapa</a>}<div className="row" style={{gap:8,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>editLocation(l)}><Pencil size={15}/> Editar</button><button className="btn btn-secondary" onClick={()=>patch({action:'delete_location',id:l.id})} disabled={saving}><Trash2 size={15}/> {saving?'Procesando…':'Eliminar'}</button></div></div>)}</div>}
  </section>

  </>}

  {!travelMode&&<>
  <section className="panel" id="agenda" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}>
      <div><h2>Calendario de disponibilidad</h2><div className="muted" style={{fontSize:13}}>Publica exactamente qué días y horas puedes atender. El cliente solo verá horas libres.</div></div>
      <button className="btn btn-primary" onClick={openAvailability}><CalendarPlus size={16}/> Agregar día y horario</button>
    </div>
    {data.availability.length===0?<div className="notice" style={{marginTop:14}}>Todavía no has publicado disponibilidad. Agrega una fecha, hora de inicio y hora de cierre.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.availability.map((a:any)=><div className="card" key={a.id}>
      <CalendarPlus size={18}/><h3>{new Date(a.startsAt).toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long',timeZone:'America/Caracas'})}</h3>
      <p><strong>{new Date(a.startsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong> a <strong>{new Date(a.endsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong></p>
      <div className="notice" style={{margin:'10px 0'}}><MapPin size={15}/> <strong>Atención en {a.location?.name||'ubicación por confirmar'}</strong><br/><span className="muted">{[a.location?.address,a.location?.city,a.location?.state,a.location?.country].filter(Boolean).join(' · ')}{a.location?.room?' · '+a.location.room:''}</span></div><div className="muted" style={{fontSize:12}}>Inicio automático. TUCITA calcula la siguiente hora según la duración del servicio y el final de la reserva anterior.</div>
      <button className="btn btn-secondary" style={{marginTop:12}} onClick={()=>patch({action:'delete_availability',id:a.id})} disabled={saving}><Trash2 size={15}/> {saving?'Procesando…':'Eliminar horario'}</button>
    </div>)}</div>}
    <div className="notice" style={{marginTop:14}}><strong>Ejemplo automático:</strong> si una cita comienza a las 9:00 y el servicio dura 45 minutos, la próxima hora disponible será 9:45. Si esa siguiente reserva dura 30 minutos, la próxima será 10:15. No tienes que configurar intervalos manuales.</div>
  </section>

  </>}

  <section className="panel" id="servicios" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Servicios, duración y precio</h2><div className="muted" style={{fontSize:13}}>{serviceHint}</div></div><button className="btn btn-primary" onClick={newService}><Plus size={16}/> Nuevo servicio</button></div>
    {data.services.length===0?<div className="notice" style={{marginTop:14}}>Agrega al menos un servicio para que tus clientes puedan reservar.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.services.map((s:any)=><div className="card" key={s.id} style={{overflow:'hidden'}}>
      {travelMode&&s.travelImage&&<img src={s.travelImage} alt={s.name} style={{width:'100%',height:150,objectFit:'cover',borderRadius:14,marginBottom:12}}/>}
      {!travelMode&&s.serviceImage&&<img src={s.serviceImage} alt={s.name} style={{width:'100%',height:150,objectFit:'cover',borderRadius:14,marginBottom:12}}/>}
      {!travelMode&&!s.serviceImage&&<BriefcaseBusiness size={18}/>}
      <h3>{s.name}</h3>
      {travelMode&&s.travelDate&&<div className="pill" style={{width:'fit-content',marginBottom:8}}>{new Date(s.travelDate+'T12:00:00').toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long'})}{s.departureTime?' · '+s.departureTime:''}{s.returnTime?'–'+s.returnTime:''}</div>}
      {travelMode&&<div className="muted" style={{fontSize:12,marginBottom:8}}>{s.capacity||1} cupo{Number(s.capacity||1)===1?'':'s'}</div>}
      <p>{(travelMode?s.summary:s.description)||'Sin descripción'}</p>
      <div className="row" style={{gap:8,flexWrap:'wrap',alignItems:'center'}}><span className="pill">{s.durationMinutes} min</span><span className="pill">{s.currency}</span><strong>{s.price}</strong>{travelMode&&s.childPrice!==null&&s.childPrice!==undefined&&<span className="muted" style={{fontSize:11}}>Niño: {s.currency} {s.childPrice}</span>}</div>
      <div className="row" style={{gap:8,marginTop:12,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>editService(s)}><Pencil size={15}/> Editar</button><button className="btn btn-secondary" onClick={()=>patch({action:'update_service',id:s.id,active:!s.active})} disabled={saving}>{saving?'Procesando…':s.active?'Pausar':'Activar'}</button></div>
    </div>)}</div>}
  </section>

  <div className="panel-grid" style={{marginTop:18}}>
   <section className="panel">
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Reservas y pagos</h2><div className="muted" style={{fontSize:13}}>Cada reserva conserva el servicio, su duración y el precio elegido por el cliente.</div></div></div>
    {upcoming.length===0?<div className="notice" style={{marginTop:14}}>Todavía no tienes reservas reales. Comparte tu enlace para comenzar.</div>:
    <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{upcoming.map((a:any)=><tr key={a.id}>
      <td><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.clientEmail} · {a.clientPhone}</div></td>
      <td>{a.serviceName}<div className="muted" style={{fontSize:12}}>{a.currency} {a.price}</div>{travelMode&&a.travelers>1&&<div className="muted" style={{fontSize:11}}>{a.travelAdults} adulto{a.travelAdults===1?'':'s'}{a.travelChildren?' + '+a.travelChildren+' niño'+(a.travelChildren===1?'':'s'):''} · {a.travelers} viajeros</div>}</td>
      <td>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}<div className="muted" style={{fontSize:12,marginTop:4}}><MapPin size={12}/> {a.location?.name||'Ubicación'}</div></td>
      <td>{a.paymentMethod||'—'}{a.paymentReference&&<div><strong>Ref: {a.paymentReference}</strong></div>}{a.paymentProofUrl&&<a className="btn btn-secondary" style={{marginTop:6,padding:'6px 9px'}} target="_blank" rel="noreferrer" href={a.paymentProofUrl}><Eye size={14}/> Ver</a>}</td>
      <td><StatusPill tone={a.status==='PAYMENT_REVIEW'?'warn':a.status==='PAYMENT_REJECTED'?'bad':['CONFIRMED','COMPLETED','ARRIVED','IN_CONSULTATION'].includes(a.status)?'ok':''}>{labels[a.status]||a.status}</StatusPill></td>
      <td><div className="row" style={{gap:6,flexWrap:'wrap'}}>
       {a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>patch({action:'approve_payment',id:a.id})} disabled={saving}>{saving?'Procesando…':'Aprobar'}</button><button className="btn btn-secondary" onClick={()=>patch({action:'reject_payment',id:a.id})} disabled={saving}>{saving?'Procesando…':'Rechazar'}</button></>}
       {a.status==='CONFIRMED'&&<button className="btn btn-secondary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'ARRIVED'})} disabled={saving}>{saving?'Procesando…':'Llegó'}</button>}
       {a.status==='ARRIVED'&&<button className="btn btn-secondary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'IN_CONSULTATION'})} disabled={saving}>{saving?'Procesando…':'Atender'}</button>}
       {a.status==='IN_CONSULTATION'&&<button className="btn btn-primary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'COMPLETED'})} disabled={saving}>{saving?'Procesando…':'Completar'}</button>}
       {a.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)&&<a className="btn btn-secondary" href={'/api/appointments/'+a.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={14}/> Recibo</a>}
       {a.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)&&a.clientEmail&&<button className="btn btn-secondary" onClick={()=>patch({action:'resend_receipt_email',id:a.id})} disabled={saving}>{saving?'Enviando…':'Reenviar al correo'}</button>}
      </div></td>
    </tr>)}</tbody></table></div>}
   </section>

   <aside style={{display:'grid',gap:18}}>
    <section className="panel"><h2>Tu página pública</h2><div className="notice"><strong>{p.name}</strong><br/>{p.activity} · {p.category}<br/>{[p.location?.city,p.location?.state,p.location?.country].filter(Boolean).join(' · ')||'Ubicación por configurar'}<br/><span style={{wordBreak:'break-all',fontSize:12}}>{publicUrl}</span></div><div className="quick-grid" style={{marginTop:12}}><button className="quick" onClick={copy}><Link2 size={18}/><strong>Copiar enlace</strong><small>{publicPath}</small></button><button className="quick" onClick={share}><Share2 size={18}/><strong>Compartir</strong><small>Enviar a clientes</small></button></div><a className="btn btn-secondary" href={publicPath} target="_blank" rel="noreferrer" style={{marginTop:12}}><ExternalLink size={15}/> Abrir mi página pública</a></section>
    <section className="panel"><h2>Estado de atención</h2><div className="muted" style={{fontSize:13,marginBottom:10}}>{p.dayStatus==='DELAYED'?'Retraso de '+p.delayMinutes+' min':p.dayStatus==='SUSPENDED'?'Atención suspendida':'Atendiendo normalmente'}</div><button className="btn btn-secondary" onClick={()=>setModal('status')}>Cambiar estado</button></section>
   </aside>
  </div>

  <section className="panel" style={{marginTop:18}}><DeleteProfileButton accountKind={String(p.type||'').toLowerCase().includes('negocio')?'commercial':'professional'} subscriptionActive={p.subscriptionStatus==='ACTIVO'}/></section>

  <section className="panel" id="pagos" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>Configura cómo te pagarán tus clientes.</div></div><button className="btn btn-secondary" onClick={()=>setModal('settings')}><Settings2 size={16}/> Configuración</button></div>
    <PaymentMethodsManager scope="DOCTOR" slug={p.slug} country={p.location?.country||'Venezuela'}/>
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
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
     <div className="field" style={{flex:1,minWidth:200}}><label>Rubro</label><select value={profile.category||'Salud'} onChange={e=>{const category=e.target.value;setProfile({...profile,category,activity:PROVIDER_CATEGORIES[category]?.[0]||'Otro'})}}>{Object.keys(PROVIDER_CATEGORIES).map(category=><option key={category} value={category}>{category}</option>)}</select></div>
     <div className="field" style={{flex:1,minWidth:200}}><label>Actividad</label><select value={profile.activity||''} onChange={e=>setProfile({...profile,activity:e.target.value})}>{(PROVIDER_CATEGORIES[profile.category||'Salud']||[profile.activity||'Otro']).map(activity=><option key={activity} value={activity}>{activity}</option>)}</select></div>
   </div>
   <div className="field"><label>Tipo</label><select value={profile.type||'Profesional independiente'} onChange={e=>setProfile({...profile,type:e.target.value})}><option>Profesional independiente</option><option>Negocio / local</option></select></div>
   {usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity)&&<div className="field"><label>Colegiatura / matrícula / credencial (opcional)</label><input value={profile.licenseNumber||''} maxLength={120} onChange={e=>setProfile({...profile,licenseNumber:e.target.value})} placeholder="Ej. número de colegiatura, matrícula profesional o registro"/><small className="muted">Publica solo información profesional que puedas respaldar.</small></div>}
   {categoryUsesWorkReferences(profile.category||p.category,profile.activity||p.activity)&&<div className="field"><label>{usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity)?'Certificaciones / credenciales':'Referencias de trabajos'}</label><div className="muted" style={{fontSize:12,marginBottom:8}}>{usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity)?'Puedes mostrar hasta 4 imágenes de títulos, certificaciones, matrículas o credenciales profesionales.':'Puedes mostrar hasta 4 mini fotos de trabajos. TUCITA las ajusta sin deformarlas.'}</div><div className="row" style={{gap:8,flexWrap:'wrap'}}>{(profile.workImages||[]).map((img:string,i:number)=><div key={i} style={{position:'relative'}}><img src={img} alt={(usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity)?'Credencial ':'Trabajo ')+(i+1)} style={{width:112,height:76,borderRadius:12,objectFit:'cover'}}/><button type="button" onClick={()=>setProfile({...profile,workImages:(profile.workImages||[]).filter((_:string,j:number)=>j!==i)})} aria-label="Quitar imagen" style={{position:'absolute',top:4,right:4,border:0,borderRadius:999,width:24,height:24,cursor:'pointer'}}><X size={14}/></button></div>)}{(profile.workImages||[]).length<4&&<label className="btn btn-secondary" style={{cursor:'pointer',height:76}}><ImagePlus size={16}/> Agregar<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>workImageChange(e.target.files?.[0])}/></label>}</div>{usesProfessionalCredentials(profile.category||p.category,profile.activity||p.activity)&&<small className="muted" style={{display:'block',marginTop:8}}>TUCITA muestra estas credenciales como información declarada por el profesional; no sustituye la verificación oficial del organismo correspondiente.</small>}</div>}
   <div className="field"><label>Nombre de ubicación</label><input value={profile.locationName||''} onChange={e=>setProfile({...profile,locationName:e.target.value})}/></div>
   <div className="field"><label>Dirección</label><input value={profile.address||''} onChange={e=>setProfile({...profile,address:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Ciudad</label><input value={profile.city||''} onChange={e=>setProfile({...profile,city:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>Estado / Provincia</label><input value={profile.state||''} onChange={e=>setProfile({...profile,state:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>País</label><input list="profile-countries" value={profile.country||''} onChange={e=>setProfile({...profile,country:e.target.value})}/><datalist id="profile-countries">{COUNTRY_SUGGESTIONS.map(x=><option key={x} value={x}/>)}</datalist></div></div>
 </div></div><div className="button-row profile-modal-actions"><button className="btn btn-primary" onClick={()=>patch({action:'profile',...profile})} disabled={saving}>{saving?'Guardando…':'Guardar perfil'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='service'&&<div className="modal-backdrop"><div className="modal"><h2>{service.id?'Editar servicio':travelMode?'Nuevo viaje':'Nuevo servicio'}</h2><div className="form">
   <div className="notice">{serviceHint}<br/><strong>Importante:</strong> esta duración controla automáticamente la agenda. No necesitas configurar cada cuánto comienza una cita.</div>
   <div className="field"><label>{travelMode?'Nombre del viaje / paquete':'Nombre del servicio'}</label><input value={service.name} onChange={e=>setService({...service,name:e.target.value})} placeholder={travelMode?'Ej. Full Day Morrocoy':activity.includes('barber')?'Ej. Corte + barba':activity.includes('manicur')?'Ej. Acrílicas':'Ej. Consulta / Servicio premium'}/></div>
   {travelMode?<>
     <div className="field"><label>Foto referencial del viaje</label><div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>{service.travelImage?<img src={service.travelImage} alt="Vista previa del viaje" style={{width:150,height:94,borderRadius:16,objectFit:'cover'}}/>:<div className="notice" style={{margin:0}}>La imagen se verá en la tarjeta que elegirá el cliente.</div>}<label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> {service.travelImage?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>travelImageChange(e.target.files?.[0])}/></label>{service.travelImage&&<button type="button" className="btn btn-secondary" onClick={()=>setService({...service,travelImage:''})}><Trash2 size={15}/> Quitar</button>}</div></div>
     <div className="field"><label>Descripción corta para la tarjeta</label><textarea rows={2} maxLength={220} value={service.summary||''} onChange={e=>setService({...service,summary:e.target.value})} placeholder="Ej. Full Day con traslado, desayuno, almuerzo y acceso a playa."/>

       <small className="muted">{String(service.summary||'').length}/220 · Debe poder leerse rápidamente desde la tarjeta.</small>
     </div>
     <div className="field"><label>Detalles del viaje</label><textarea rows={4} maxLength={1800} value={service.description||''} onChange={e=>setService({...service,description:e.target.value})} placeholder="Incluye, punto de encuentro, recomendaciones, condiciones y cualquier detalle adicional."/></div>
     <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
       <div className="field" style={{flex:1,minWidth:180}}><label>Fecha de salida</label><input type="date" value={service.travelDate||''} onChange={e=>setService({...service,travelDate:e.target.value})}/></div>
       <div className="field" style={{flex:1,minWidth:150}}><label>Hora de salida</label><input type="time" value={service.departureTime||''} onChange={e=>setService({...service,departureTime:e.target.value})}/></div>
       <div className="field" style={{flex:1,minWidth:150}}><label>Hora estimada de regreso</label><input type="time" value={service.returnTime||''} onChange={e=>setService({...service,returnTime:e.target.value})}/></div>
     </div>
     <div className="field" style={{maxWidth:220}}><label>Cupos disponibles</label><input type="number" min="1" max="500" value={service.capacity??''} onChange={e=>setService({...service,capacity:e.target.value===''?'':Math.max(1,Number(e.target.value))})} placeholder="Escribe la cantidad"/></div>
     <div className="notice"><strong>Calendario automático para Viajes.</strong><br/>Al guardar, TUCITA programa internamente esta salida con su fecha, hora, duración y cupos. No necesitas crear ubicaciones ni publicar un calendario aparte.</div>
   </>:<>
     <div className="field">
       <label>Foto referencial del servicio (recomendada)</label>
       <div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>
         {service.serviceImage?<img src={service.serviceImage} alt="Vista previa del servicio" style={{width:150,height:104,borderRadius:16,objectFit:'cover'}}/>:<div className="notice" style={{margin:0}}>Ej.: uñas francesas, corte, maquillaje, tatuaje, plato, espacio o resultado del servicio.</div>}
         <label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> {service.serviceImage?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>serviceImageChange(e.target.files?.[0])}/></label>
         {service.serviceImage&&<button type="button" className="btn btn-secondary" onClick={()=>setService({...service,serviceImage:''})}><Trash2 size={15}/> Quitar</button>}
       </div>
       <small className="muted">La miniatura aparecerá junto al precio y el cliente podrá verla grande al seleccionar el servicio.</small>
     </div>
     <div className="field"><label>Descripción</label><textarea rows={3} value={service.description} onChange={e=>setService({...service,description:e.target.value})} placeholder="Explica claramente qué incluye el servicio."/></div>
   </>}
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
     <div className="field" style={{flex:1,minWidth:150}}><label>{travelMode?'Duración del viaje':'Duración real'}</label><select value={service.durationMinutes} onChange={e=>setService({...service,durationMinutes:Number(e.target.value)})}><option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={75}>75 min</option><option value={90}>90 min</option><option value={120}>2 h</option><option value={180}>3 h</option>{travelMode&&<><option value={240}>4 h</option><option value={360}>6 h</option><option value={480}>8 h</option><option value={600}>10 h</option><option value={720}>12 h</option><option value={1440}>24 h</option></>}</select></div>
     <div className="field" style={{flex:1,minWidth:120}}><label>Moneda</label><select value={service.currency} onChange={e=>setService({...service,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div>
     <div className="field" style={{flex:1,minWidth:150}}><label>{travelMode?'Precio por adulto':'Precio'}</label><input type="number" min="0" step="0.01" value={service.price??''} onChange={e=>setService({...service,price:e.target.value===''?'':Number(e.target.value)})} placeholder="Escribe el monto"/></div>
     {travelMode&&<div className="field" style={{flex:1,minWidth:150}}><label>Precio por niño (opcional)</label><input type="number" min="0" step="0.01" value={service.childPrice} onChange={e=>setService({...service,childPrice:e.target.value===''?'':Number(e.target.value)})} placeholder="Igual al adulto"/><small className="muted">Si lo dejas vacío, el niño paga el mismo precio del adulto.</small></div>}
   </div>{fxPreview(Number(service.price||0),service.currency||'USD')}
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={saveService} disabled={saving}>{saving?'Guardando…':service.id?'Guardar cambios':travelMode?'Agregar viaje':'Agregar servicio'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='location'&&<div className="modal-backdrop"><div className="modal"><h2>{locationForm.id?'Editar ubicación':'Nueva ubicación'}</h2><div className="form">
   <div className="field"><label>Nombre visible</label><input value={locationForm.name} onChange={e=>setLocationForm({...locationForm,name:e.target.value})} placeholder="Ej. Clínica X / Sede Centro / Consultorio privado"/></div>
   <div className="field"><label>Dirección exacta</label><input value={locationForm.address} onChange={e=>setLocationForm({...locationForm,address:e.target.value})} placeholder="Ej. Av. Principal, Edif. Centro Médico, Torre B, local 204"/><small className="muted">Escribe calle/avenida, edificio o centro comercial y número/local. Esta dirección será usada para mostrarle al cliente cómo llegar.</small></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:170}}><label>Ciudad</label><input value={locationForm.city} onChange={e=>setLocationForm({...locationForm,city:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:170}}><label>Estado / Provincia</label><input value={locationForm.state} onChange={e=>setLocationForm({...locationForm,state:e.target.value})}/></div></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:170}}><label>País</label><input list="location-countries" value={locationForm.country} onChange={e=>setLocationForm({...locationForm,country:e.target.value})}/><datalist id="location-countries">{COUNTRY_SUGGESTIONS.map(x=><option key={x} value={x}/>)}</datalist></div><div className="field" style={{flex:1,minWidth:170}}><label>Consultorio / local / referencia</label><input value={locationForm.room} onChange={e=>setLocationForm({...locationForm,room:e.target.value})} placeholder="Ej. Piso 2 · Consultorio 204"/></div></div>
   {mapQuery(locationForm)&&<div className="field"><label>Vista previa del mapa</label><div style={{border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}><iframe title="Vista previa de ubicación" src={'https://www.google.com/maps?q='+encodeURIComponent(mapQuery(locationForm))+'&output=embed'} width="100%" height="220" style={{border:0,display:'block'}} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div><div className="row" style={{marginTop:8,gap:8,flexWrap:'wrap'}}><a className="btn btn-secondary" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(mapQuery(locationForm))} target="_blank" rel="noreferrer"><Navigation size={15}/> Comprobar en Google Maps</a><span className="muted" style={{fontSize:12}}>Verifica que el pin corresponda al lugar real antes de guardar.</span></div></div>}
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={saveLocation} disabled={saving}>{saving?'Guardando…':'Guardar ubicación'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='availability'&&<div className="modal-backdrop"><div className="modal"><h2>Agregar disponibilidad</h2><div className="form">
   <div className="field"><label>¿Dónde atenderás en este horario?</label><select value={av.locationId} onChange={e=>setAv({...av,locationId:e.target.value})}><option value="">Selecciona una ubicación</option>{(data.locations||[]).map((l:any)=><option key={l.id} value={l.id}>{l.name}{l.room?' · '+l.room:''}</option>)}</select></div>
   <div className="field"><label>Día disponible</label><input type="date" value={av.date} onChange={e=>setAv({...av,date:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:150}}><label>Disponible desde</label><input type="time" value={av.start} onChange={e=>setAv({...av,start:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:150}}><label>Disponible hasta</label><input type="time" value={av.end} onChange={e=>setAv({...av,end:e.target.value})}/></div></div>
   <div className="notice" style={{display:'grid',gap:8}}>
     <strong>✓ TUCITA calcula las horas automáticamente</strong>
     <span>✓ Tú solo indicas el día, desde qué hora atiendes y hasta qué hora.</span>
     <span>✓ La duración se toma de cada servicio: 15, 30, 45, 60 min, etc.</span>
     <span>✓ La siguiente cita comienza exactamente cuando termina la anterior.</span>
     <span>✓ Si cambia el servicio reservado, TUCITA recalcula las siguientes horas disponibles sin solaparlas.</span>
     <span>✓ No puedes publicar dos veces el mismo bloque ni crear bloques que se crucen entre sí.</span>
   </div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={saveAvailability} disabled={saving}><Clock3 size={16}/> {saving?'Publicando…':'Publicar horario'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='settings'&&<div className="modal-backdrop"><div className="modal"><h2>Configuración de reservas</h2><div className="form">
   <div className="row" style={{gap:12,alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Precio base</label><input type="number" min="0" step="0.01" value={Number(settings.price||0)===0?'':settings.price} onChange={e=>setSettings({...settings,price:e.target.value===''?'':Number(e.target.value)})} placeholder="Escribe el monto"/></div><div className="field" style={{flex:1}}><label>Moneda</label><select value={settings.currency||'USD'} onChange={e=>setSettings({...settings,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>{fxPreview(Number(settings.price||0),settings.currency||'USD')}
   <div className="field"><label>Duración predeterminada</label><input type="number" value={settings.defaultMinutes||30} onChange={e=>setSettings({...settings,defaultMinutes:Number(e.target.value)})}/></div>
   <div className="field"><label>Instrucciones de pago</label><textarea rows={4} value={settings.paymentInstructions||''} onChange={e=>setSettings({...settings,paymentInstructions:e.target.value})}/></div>
   <label className="notice row"><input type="checkbox" checked={settings.acceptsOnlineBooking!==false} onChange={e=>setSettings({...settings,acceptsOnlineBooking:e.target.checked})}/><span>Aceptar reservas en línea</span></label>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'settings',...settings})} disabled={saving}>{saving?'Guardando…':'Guardar'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='status'&&<div className="modal-backdrop"><div className="modal"><h2>Estado de atención</h2><div className="form">
   <div className="field"><label>Estado</label><select value={dayStatus.status} onChange={e=>setDayStatus({...dayStatus,status:e.target.value})}><option value="NORMAL">Normal</option><option value="DELAYED">Retrasado</option><option value="SUSPENDED">Suspendido</option></select></div>
   {dayStatus.status==='DELAYED'&&<div className="field"><label>Minutos de retraso</label><input type="number" min="1" value={Number(dayStatus.delayMinutes||0)===0?'':dayStatus.delayMinutes} onChange={e=>setDayStatus({...dayStatus,delayMinutes:e.target.value===''?0:Number(e.target.value)})} placeholder="Escribe los minutos"/></div>}
   <div className="field"><label>Nota opcional</label><input value={dayStatus.note} onChange={e=>setDayStatus({...dayStatus,note:e.target.value})}/></div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'day_status',...dayStatus})} disabled={saving}>{saving?'Guardando…':'Guardar estado'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {paymentReminder&&<div className="modal-backdrop"><div className="modal" style={{maxWidth:470,textAlign:'center'}}>
   <div style={{fontSize:50,lineHeight:1}}>🎉</div>
   <h2 style={{marginTop:12}}>¡Tu servicio ya está publicado!</h2>
   <p className="muted">Solo te falta un paso importante para empezar a recibir reservas: indica cómo podrán pagarte tus clientes.</p>
   <div className="notice" style={{textAlign:'left',marginTop:14}}><strong>💳 No olvides configurar tus métodos de pago.</strong><br/>TUCITA mostrará al cliente únicamente las opciones válidas según tu país.</div>
   <div className="button-row" style={{justifyContent:'center',marginTop:18,flexWrap:'wrap'}}>
     <button className="btn btn-primary" onClick={()=>{setPaymentReminder(false);setTimeout(()=>document.getElementById('pagos')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}}>Configurar pagos ahora</button>
     <button className="btn btn-secondary" onClick={()=>setPaymentReminder(false)}>Lo haré después</button>
   </div>
 </div></div>}

 {toast&&<div className="toast">{toast}</div>}
 </div>
}
