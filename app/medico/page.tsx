'use client';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CalendarPlus, Clock3, Link2, Share2, Settings2, Eye, Plus, UserRound, BriefcaseBusiness, Pencil, Trash2 } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';

const labels:any={PAYMENT_REVIEW:'Pago en revisión',PAYMENT_REJECTED:'Pago rechazado',CONFIRMED:'Confirmada',ON_THE_WAY:'En camino',ARRIVED:'Llegó',IN_CONSULTATION:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asistió'};

export default function Medico(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [toast,setToast]=useState('');
 const [modal,setModal]=useState<'profile'|'availability'|'settings'|'service'|'status'|null>(null);
 const [profile,setProfile]=useState<any>({});
 const [settings,setSettings]=useState<any>({});
 const [service,setService]=useState({id:'',name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
 const [av,setAv]=useState({date:'',start:'08:00',end:'12:00',slotMinutes:15});
 const [dayStatus,setDayStatus]=useState({status:'NORMAL',delayMinutes:0,note:''});

 const load=()=>fetch('/api/me/provider').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
   if(!ok){setError(j.error||'No se pudo abrir tu panel');return}
   setData(j);setError('');
   setProfile({name:j.provider.name,phone:j.provider.phone,category:j.provider.category,activity:j.provider.activity,type:j.provider.type,locationName:j.provider.location?.name||'',address:j.provider.location?.address||'',city:j.provider.location?.city||'',state:j.provider.location?.state||'',country:j.provider.location?.country||'Venezuela'});
   setSettings({price:j.provider.price,currency:j.provider.currency,paymentInstructions:j.provider.paymentInstructions,defaultMinutes:j.provider.defaultMinutes,acceptsOnlineBooking:j.provider.acceptsOnlineBooking});
   setDayStatus({status:j.provider.dayStatus,delayMinutes:j.provider.delayMinutes,note:''});
 }).catch(()=>setError('No se pudo conectar con TURNAVIA.'));

 useEffect(()=>{load()},[]);
 const upcoming=useMemo(()=>data?.appointments?.filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-86400000)||[],[data]);
 const review=useMemo(()=>upcoming.filter((a:any)=>a.status==='PAYMENT_REVIEW'),[upcoming]);
 const confirmed=useMemo(()=>upcoming.filter((a:any)=>['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION'].includes(a.status)),[upcoming]);

 async function patch(body:any){
   const r=await fetch('/api/me/provider',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
   const j=await r.json();
   if(!r.ok){setToast(j.error||'No se pudo guardar');return false}
   setModal(null);setToast('Cambios guardados');await load();setTimeout(()=>setToast(''),1800);return true;
 }
 async function copy(){
   if(!data?.provider?.slug)return;
   await navigator.clipboard.writeText(location.origin+'/reservar/'+data.provider.slug);
   setToast('Enlace copiado');setTimeout(()=>setToast(''),1800);
 }
 async function share(){
   if(!data?.provider?.slug)return;
   const url=location.origin+'/reservar/'+data.provider.slug;
   if(navigator.share)await navigator.share({title:'Reserva en TURNAVIA',text:'Reserva tu cita o servicio conmigo en TURNAVIA',url});else copy();
 }
 function openAvailability(){
   const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Caracas'});
   setAv(v=>({...v,date:v.date||today}));
   setModal('availability');
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
 const activity=String(p.activity||'').toLowerCase();
 const serviceHint=activity.includes('barber')?'Ej.: Corte clásico, Fade, Corte + barba, Barba completa':activity.includes('manicur')||activity.includes('uña')?'Ej.: Manicura, Semipermanente, Acrílicas, Jelly, Nail art, Retiro, Mantenimiento':'Crea cada servicio por separado con su duración y precio.';

 return <div className="dashboard"><Sidebar role="medico"/><main className="main">
  <div id="perfil" className="topbar"><div><div className="muted" style={{fontSize:13}}>{p.category} · {p.activity}</div><h1>Hola, {p.name}</h1></div><div className="row" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{p.subscriptionStatus==='ACTIVO'?'Cuenta activa':p.subscriptionStatus==='SUSPENDIDO'?'Cuenta suspendida':'Prueba gratis'}</span><button className="btn btn-secondary" onClick={()=>setModal('profile')}><UserRound size={16}/> Perfil</button></div></div>

  <div className="stat-grid">
    <div className="stat"><small>Reservas activas</small><div className="n">{confirmed.length}</div></div>
    <div className="stat"><small>Pagos por revisar</small><div className="n">{review.length}</div></div>
    <div className="stat"><small>Servicios</small><div className="n">{data.services.filter((s:any)=>s.active).length}</div></div>
    <div className="stat"><small>Bloques disponibles</small><div className="n">{data.availability.length}</div></div>
  </div>

  <section className="panel" id="agenda" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}>
      <div><h2>Calendario de disponibilidad</h2><div className="muted" style={{fontSize:13}}>Publica exactamente qué días y horas puedes atender. El cliente solo verá horas libres.</div></div>
      <button className="btn btn-primary" onClick={openAvailability}><CalendarPlus size={16}/> Agregar día y horario</button>
    </div>
    {data.availability.length===0?<div className="notice" style={{marginTop:14}}>Todavía no has publicado disponibilidad. Agrega una fecha, hora de inicio y hora de cierre.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.availability.map((a:any)=><div className="card" key={a.id}>
      <CalendarPlus size={18}/><h3>{new Date(a.startsAt).toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'long',timeZone:'America/Caracas'})}</h3>
      <p><strong>{new Date(a.startsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong> a <strong>{new Date(a.endsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</strong></p>
      <div className="muted" style={{fontSize:12}}>Inicios cada {a.slotMinutes} min. TURNAVIA adapta el espacio a la duración real del servicio.</div>
      <button className="btn btn-secondary" style={{marginTop:12}} onClick={()=>patch({action:'delete_availability',id:a.id})}><Trash2 size={15}/> Eliminar horario</button>
    </div>)}</div>}
    <div className="notice" style={{marginTop:14}}><strong>Ejemplo:</strong> si publicas 9:00–13:00 y un corte dura 30 minutos, TURNAVIA ofrece horas que permitan completar esos 30 minutos. Si “Corte + barba” dura 45 minutos, recalcula automáticamente las horas disponibles.</div>
  </section>

  <section className="panel" id="servicios" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Servicios, duración y precio</h2><div className="muted" style={{fontSize:13}}>{serviceHint}</div></div><button className="btn btn-primary" onClick={newService}><Plus size={16}/> Nuevo servicio</button></div>
    {data.services.length===0?<div className="notice" style={{marginTop:14}}>Agrega al menos un servicio para que tus clientes puedan reservar.</div>:
    <div className="grid-3" style={{marginTop:14}}>{data.services.map((s:any)=><div className="card" key={s.id}><BriefcaseBusiness size={18}/><h3>{s.name}</h3><p>{s.description||'Sin descripción'}</p><div className="row space"><strong>{s.currency} {s.price}</strong><span className="pill">{s.durationMinutes} min</span></div><div className="row" style={{gap:8,marginTop:12,flexWrap:'wrap'}}><button className="btn btn-secondary" onClick={()=>editService(s)}><Pencil size={15}/> Editar</button><button className="btn btn-secondary" onClick={()=>patch({action:'update_service',id:s.id,active:!s.active})}>{s.active?'Pausar':'Activar'}</button></div></div>)}</div>}
  </section>

  <div className="panel-grid" style={{marginTop:18}}>
   <section className="panel">
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Reservas y pagos</h2><div className="muted" style={{fontSize:13}}>Cada reserva conserva el servicio, su duración y el precio elegido por el cliente.</div></div></div>
    {upcoming.length===0?<div className="notice" style={{marginTop:14}}>Todavía no tienes reservas reales. Comparte tu enlace para comenzar.</div>:
    <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{upcoming.map((a:any)=><tr key={a.id}>
      <td><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.clientEmail} · {a.clientPhone}</div></td>
      <td>{a.serviceName}<div className="muted" style={{fontSize:12}}>{a.currency} {a.price}</div></td>
      <td>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}</td>
      <td>{a.paymentMethod||'—'}{a.paymentReference&&<div><strong>Ref: {a.paymentReference}</strong></div>}{a.paymentProofUrl&&<a className="btn btn-secondary" style={{marginTop:6,padding:'6px 9px'}} target="_blank" rel="noreferrer" href={a.paymentProofUrl}><Eye size={14}/> Ver</a>}</td>
      <td><StatusPill tone={a.status==='PAYMENT_REVIEW'?'warn':a.status==='PAYMENT_REJECTED'?'bad':['CONFIRMED','COMPLETED','ARRIVED','IN_CONSULTATION'].includes(a.status)?'ok':''}>{labels[a.status]||a.status}</StatusPill></td>
      <td><div className="row" style={{gap:6,flexWrap:'wrap'}}>
       {a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>patch({action:'approve_payment',id:a.id})}>Aprobar</button><button className="btn btn-secondary" onClick={()=>patch({action:'reject_payment',id:a.id})}>Rechazar</button></>}
       {a.status==='CONFIRMED'&&<button className="btn btn-secondary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'ARRIVED'})}>Llegó</button>}
       {a.status==='ARRIVED'&&<button className="btn btn-secondary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'IN_CONSULTATION'})}>Atender</button>}
       {a.status==='IN_CONSULTATION'&&<button className="btn btn-primary" onClick={()=>patch({action:'appointment_status',id:a.id,status:'COMPLETED'})}>Completar</button>}
      </div></td>
    </tr>)}</tbody></table></div>}
   </section>

   <aside style={{display:'grid',gap:18}}>
    <section className="panel"><h2>Tu página pública</h2><div className="notice"><strong>{p.name}</strong><br/>{p.activity} · {p.category}</div><div className="quick-grid" style={{marginTop:12}}><button className="quick" onClick={copy}><Link2 size={18}/><strong>Copiar enlace</strong><small>/reservar/{p.slug}</small></button><button className="quick" onClick={share}><Share2 size={18}/><strong>Compartir</strong><small>Enviar a clientes</small></button></div></section>
    <section className="panel"><h2>Estado de atención</h2><div className="muted" style={{fontSize:13,marginBottom:10}}>{p.dayStatus==='DELAYED'?'Retraso de '+p.delayMinutes+' min':p.dayStatus==='SUSPENDED'?'Atención suspendida':'Atendiendo normalmente'}</div><button className="btn btn-secondary" onClick={()=>setModal('status')}>Cambiar estado</button></section>
   </aside>
  </div>

  <section className="panel" id="pagos" style={{marginTop:18}}>
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>Configura cómo te pagarán tus clientes.</div></div><button className="btn btn-secondary" onClick={()=>setModal('settings')}><Settings2 size={16}/> Configuración</button></div>
    <PaymentMethodsManager scope="DOCTOR" slug={p.slug}/>
  </section>
 </main>

 {modal==='profile'&&<div className="modal-backdrop"><div className="modal"><h2>Editar perfil</h2><div className="form">
   <div className="field"><label>Nombre visible</label><input value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})}/></div>
   <div className="field"><label>Teléfono / WhatsApp</label><input value={profile.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:200}}><label>Rubro</label><input value={profile.category||''} onChange={e=>setProfile({...profile,category:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:200}}><label>Actividad</label><input value={profile.activity||''} onChange={e=>setProfile({...profile,activity:e.target.value})}/></div></div>
   <div className="field"><label>Tipo</label><select value={profile.type||'Profesional independiente'} onChange={e=>setProfile({...profile,type:e.target.value})}><option>Profesional independiente</option><option>Negocio / local</option></select></div>
   <div className="field"><label>Nombre de ubicación</label><input value={profile.locationName||''} onChange={e=>setProfile({...profile,locationName:e.target.value})}/></div>
   <div className="field"><label>Dirección</label><input value={profile.address||''} onChange={e=>setProfile({...profile,address:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Ciudad</label><input value={profile.city||''} onChange={e=>setProfile({...profile,city:e.target.value})}/></div><div className="field" style={{flex:1}}><label>Estado</label><input value={profile.state||''} onChange={e=>setProfile({...profile,state:e.target.value})}/></div></div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'profile',...profile})}>Guardar perfil</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='service'&&<div className="modal-backdrop"><div className="modal"><h2>{service.id?'Editar servicio':'Nuevo servicio'}</h2><div className="form">
   <div className="notice">{serviceHint}</div>
   <div className="field"><label>Nombre del servicio</label><input value={service.name} onChange={e=>setService({...service,name:e.target.value})} placeholder={activity.includes('barber')?'Ej. Corte + barba':activity.includes('manicur')?'Ej. Acrílicas':'Ej. Consulta / Servicio premium'}/></div>
   <div className="field"><label>Descripción</label><textarea rows={3} value={service.description} onChange={e=>setService({...service,description:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:150}}><label>Duración real</label><select value={service.durationMinutes} onChange={e=>setService({...service,durationMinutes:Number(e.target.value)})}><option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={75}>75 min</option><option value={90}>90 min</option><option value={120}>120 min</option><option value={180}>180 min</option></select></div><div className="field" style={{flex:1,minWidth:150}}><label>Precio</label><input type="number" min="0" step="0.01" value={service.price} onChange={e=>setService({...service,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:120}}><label>Moneda</label><select value={service.currency} onChange={e=>setService({...service,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={saveService}>{service.id?'Guardar cambios':'Agregar servicio'}</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='availability'&&<div className="modal-backdrop"><div className="modal"><h2>Agregar disponibilidad</h2><div className="form">
   <div className="field"><label>Día disponible</label><input type="date" value={av.date} onChange={e=>setAv({...av,date:e.target.value})}/></div>
   <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:150}}><label>Disponible desde</label><input type="time" value={av.start} onChange={e=>setAv({...av,start:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:150}}><label>Disponible hasta</label><input type="time" value={av.end} onChange={e=>setAv({...av,end:e.target.value})}/></div></div>
   <div className="field"><label>Cada cuánto puede comenzar una reserva</label><select value={av.slotMinutes} onChange={e=>setAv({...av,slotMinutes:Number(e.target.value)})}><option value={10}>Cada 10 min</option><option value={15}>Cada 15 min</option><option value={20}>Cada 20 min</option><option value={30}>Cada 30 min</option><option value={45}>Cada 45 min</option><option value={60}>Cada 60 min</option></select></div>
   <div className="notice">La duración no se fija aquí. La duración viene de cada servicio. Por ejemplo: corte 30 min, corte + barba 45 min, acrílicas 90 min.</div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'add_availability',...av})}><Clock3 size={16}/> Publicar horario</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='settings'&&<div className="modal-backdrop"><div className="modal"><h2>Configuración de reservas</h2><div className="form">
   <div className="row" style={{gap:12,alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Precio base</label><input type="number" value={settings.price??0} onChange={e=>setSettings({...settings,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1}}><label>Moneda</label><select value={settings.currency||'USD'} onChange={e=>setSettings({...settings,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>
   <div className="field"><label>Duración predeterminada</label><input type="number" value={settings.defaultMinutes||30} onChange={e=>setSettings({...settings,defaultMinutes:Number(e.target.value)})}/></div>
   <div className="field"><label>Instrucciones de pago</label><textarea rows={4} value={settings.paymentInstructions||''} onChange={e=>setSettings({...settings,paymentInstructions:e.target.value})}/></div>
   <label className="notice row"><input type="checkbox" checked={settings.acceptsOnlineBooking!==false} onChange={e=>setSettings({...settings,acceptsOnlineBooking:e.target.checked})}/><span>Aceptar reservas en línea</span></label>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'settings',...settings})}>Guardar</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {modal==='status'&&<div className="modal-backdrop"><div className="modal"><h2>Estado de atención</h2><div className="form">
   <div className="field"><label>Estado</label><select value={dayStatus.status} onChange={e=>setDayStatus({...dayStatus,status:e.target.value})}><option value="NORMAL">Normal</option><option value="DELAYED">Retrasado</option><option value="SUSPENDED">Suspendido</option></select></div>
   {dayStatus.status==='DELAYED'&&<div className="field"><label>Minutos de retraso</label><input type="number" value={dayStatus.delayMinutes} onChange={e=>setDayStatus({...dayStatus,delayMinutes:Number(e.target.value)})}/></div>}
   <div className="field"><label>Nota opcional</label><input value={dayStatus.note} onChange={e=>setDayStatus({...dayStatus,note:e.target.value})}/></div>
 </div><div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" onClick={()=>patch({action:'day_status',...dayStatus})}>Guardar estado</button><button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancelar</button></div></div></div>}

 {toast&&<div className="toast">{toast}</div>}
 </div>
}
