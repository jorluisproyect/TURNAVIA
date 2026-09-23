'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarCheck2, CalendarClock, CarFront, CheckCircle2, MapPin, XCircle, FileText, UserRound, Search } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';

const label:any={PAYMENT_REVIEW:'Pago en revisión',PAYMENT_REJECTED:'Pago rechazado',CONFIRMED:'Confirmada',ON_THE_WAY:'En camino',ARRIVED:'Ya llegaste',IN_CONSULTATION:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asististe'};

export default function Paciente(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [msg,setMsg]=useState('');
 const {busy:saving,run:runSave}=useActionLock();
 const [reschedule,setReschedule]=useState<any>(null);
 const [resData,setResData]=useState<any>(null);
 const [resDate,setResDate]=useState('');
 const [resStart,setResStart]=useState('');

 const load=()=>fetch('/api/me/patient').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{if(!ok){setError(j.error||'No se pudo cargar tu cuenta');return}setData(j);setError('')}).catch(()=>setError('No se pudo conectar con TUCITA.'));
 useEffect(()=>{load()},[]);
 const active=useMemo(()=>data?.appointments?.filter((a:any)=>!['COMPLETED','CANCELLED','PAYMENT_REJECTED'].includes(a.status))||[],[data]);
 const history=useMemo(()=>data?.appointments?.filter((a:any)=>['COMPLETED','CANCELLED','PAYMENT_REJECTED'].includes(a.status))||[],[data]);
 const next=useMemo(()=>[...active].filter((a:any)=>new Date(a.startsAt).getTime()>=Date.now()-3600000).sort((a:any,b:any)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime())[0],[active]);

 async function action(id:string,status:string){
   await runSave(async()=>{
     showActionFeedback('saving','Actualizando tu reserva…');
     try{
       const r=await fetch('/api/me/patient',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'appointment_status',id,status})});
       const j=await r.json();
       if(!r.ok){showActionFeedback('error',j.error||'No se pudo actualizar la reserva.');return}
       const message=status==='ON_THE_WAY'?'El profesional ya sabe que vas en camino.':status==='ARRIVED'?'Tu llegada quedó registrada.':status==='CANCELLED'?'Tu reserva fue cancelada.':'Tu reserva fue actualizada.';
       showActionFeedback('success',message);
       await load();
     }catch{showActionFeedback('error','No se pudo conectar con TUCITA. Intenta de nuevo.')}
   });
 }

 async function openReschedule(ap:any){
   if(!ap.serviceId){setMsg('Esta reserva antigua no tiene servicio asociado para reprogramar automáticamente.');return}
   setMsg('');setReschedule(ap);setResData(null);setResDate('');setResStart('');
   try{
     const r=await fetch('/api/public/provider/'+encodeURIComponent(ap.providerSlug)+'?serviceId='+encodeURIComponent(ap.serviceId));
     const j=await r.json();
     if(!r.ok){setMsg(j.error||'No se pudo cargar la disponibilidad');setReschedule(null);return}
     setResData(j);
     const first=j.availability?.find((a:any)=>a.slots?.some((s:any)=>s.available));
     setResDate(first?.date||'');
     setResStart(first?.slots?.find((s:any)=>s.available)?.startsAt||'');
   }catch{setMsg('No se pudo cargar la disponibilidad.');setReschedule(null)}
 }

 async function confirmReschedule(){
   if(!reschedule||!resStart)return;
   await runSave(async()=>{
     showActionFeedback('saving','Guardando la nueva fecha de tu reserva…');
     try{
       const r=await fetch('/api/me/patient',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'reschedule',id:reschedule.id,startsAt:resStart})});
       const j=await r.json();
       if(!r.ok){showActionFeedback('error',j.error||'No se pudo reprogramar la reserva.');return}
       setReschedule(null);setResData(null);
       showActionFeedback('success','Tu reserva fue reprogramada correctamente.');
       await load();
     }catch{showActionFeedback('error','No se pudo conectar con TUCITA. Intenta de nuevo.')}
   });
 }

 if(error&&!data)return <div className="dashboard"><Sidebar role="paciente"/><main className="main"><section className="panel"><h1>Mi cuenta</h1><div className="notice danger">{error}</div></section></main></div>;
 if(!data)return <div className="dashboard"><Sidebar role="paciente"/><main className="main">Cargando…</main></div>;

 return <div className="dashboard"><Sidebar role="paciente"/><main className="main">
   <div className="topbar"><div className="row" style={{gap:12,alignItems:'center'}}>{data.patient.profileImage?<img src={data.patient.profileImage} alt="" style={{width:56,height:56,borderRadius:18,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:56,height:56,borderRadius:18}}><UserRound size={23}/></div>}<div><div className="muted" style={{fontSize:13}}>Mi TUCITA</div><h1>Hola, {data.patient.name}</h1></div></div><Link className="btn btn-primary" href="/explorar"><Search size={16}/> Explorar</Link></div>

   {next&&<section className="panel" style={{marginBottom:18,background:'linear-gradient(145deg,#ffffff,#eef9f6)'}}>
     <div className="row space" style={{gap:16,alignItems:'flex-start',flexWrap:'wrap'}}><div><span className="eyebrow"><CalendarCheck2 size={15}/> PRÓXIMA CITA</span><h2 style={{fontSize:26,margin:'10px 0 5px'}}>{next.providerName}</h2><div className="muted">{next.serviceName} · {next.activity}</div><div style={{marginTop:10}}><strong>{new Date(next.startsAt).toLocaleString('es-VE',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</strong></div><div className="row muted" style={{fontSize:13,marginTop:8}}><MapPin size={15}/>{next.location||'Ubicación por confirmar'}</div></div><div className="button-row"><Link className="btn btn-secondary" href={'/reservar/'+next.providerSlug}>Reservar otra vez</Link>{next.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(next.status)&&<a className="btn btn-primary" href={'/api/appointments/'+next.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={16}/> Recibo + QR</a>}</div></div>
   </section>}

   <div id="reservas"/>{active.length===0?<section className="panel"><div className="empty">No tienes reservas activas. <Link href="/explorar">Explorar profesionales y negocios</Link>.</div></section>:
   <div style={{display:'grid',gap:18}}>{active.map((ap:any)=><section className="panel" key={ap.id}>
      <span className="eyebrow"><CalendarCheck2 size={15}/> Reserva preagendada</span>
      <div className="row space" style={{padding:'18px 0 10px',gap:14,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div><h2 style={{fontSize:25,marginBottom:6}}>{ap.providerName}</h2><div className="muted">{ap.activity} · {ap.category}</div></div>
        <StatusPill tone={ap.status==='PAYMENT_REVIEW'?'warn':ap.status==='PAYMENT_REJECTED'?'bad':['CONFIRMED','ARRIVED','IN_CONSULTATION'].includes(ap.status)?'ok':''}>{label[ap.status]||ap.status}</StatusPill>
      </div>
      <div className="card" style={{boxShadow:'none',background:'#f9fcfb'}}>
       <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div><strong>{ap.serviceName}</strong><div style={{marginTop:6}}>{new Date(ap.startsAt).toLocaleString('es-VE',{weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}</div><div className="row muted" style={{fontSize:13,marginTop:8}}><MapPin size={15}/>{ap.location||'Ubicación por confirmar'}</div></div>
        <div style={{textAlign:'right'}}><strong>{ap.currency} {ap.price}</strong><div className="muted" style={{fontSize:12}}>{ap.paymentMethod||'—'} · {ap.paymentReference||'—'}</div></div>
       </div>
      </div>
      {ap.status==='PAYMENT_REVIEW'&&<div className="notice" style={{marginTop:14}}><strong>Tu pago está en revisión.</strong> La reserva se confirmará cuando el profesional o negocio valide el comprobante.</div>}
      {ap.status==='CONFIRMED'&&<div className="notice" style={{marginTop:14}}><strong>Reserva confirmada.</strong> Puedes avisar cuando vayas en camino o cuando hayas llegado.</div>}
      <div className="hero-actions" style={{marginTop:14}}>
        {['CONFIRMED','ON_THE_WAY'].includes(ap.status)&&<button className="btn btn-primary" disabled={saving} onClick={()=>action(ap.id,'ON_THE_WAY')}><CarFront size={17}/> Estoy en camino</button>}
        {['CONFIRMED','ON_THE_WAY'].includes(ap.status)&&<button className="btn btn-secondary" disabled={saving} onClick={()=>action(ap.id,'ARRIVED')}><CheckCircle2 size={17}/> Ya llegué</button>}
        {!ap.rescheduleUsed&&['PAYMENT_REVIEW','CONFIRMED'].includes(ap.status)&&<button className="btn btn-secondary" onClick={()=>openReschedule(ap)}><CalendarClock size={17}/> Reprogramar</button>}
        {ap.rescheduleUsed&&<span className="pill">Reprogramación usada</span>}
        {!['COMPLETED','CANCELLED','IN_CONSULTATION'].includes(ap.status)&&<button className="btn btn-secondary" disabled={saving} onClick={()=>action(ap.id,'CANCELLED')}><XCircle size={17}/> Cancelar</button>}
        {ap.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(ap.status)&&<a className="btn btn-secondary" href={'/api/appointments/'+ap.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={16}/> Descargar recibo</a>}<Link className="btn btn-secondary" href={'/reservar/'+ap.providerSlug}>Reservar otra</Link>
      </div>
   </section>)}</div>}

   {history.length>0&&<section className="panel" style={{marginTop:18}}><h2>Historial</h2><div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Profesional / negocio</th><th>Servicio</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{history.map((a:any)=><tr key={a.id}><td><strong>{a.providerName}</strong><div className="muted" style={{fontSize:12}}>{a.activity}</div></td><td>{a.serviceName}</td><td>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short'})}<div className="muted" style={{fontSize:12}}>{a.location}</div></td><td><StatusPill tone={a.status==='COMPLETED'?'ok':a.status==='PAYMENT_REJECTED'?'bad':''}>{label[a.status]||a.status}</StatusPill>{a.receiptNumber&&a.status==='COMPLETED'&&<div style={{marginTop:6}}><a className="btn btn-secondary" href={'/api/appointments/'+a.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={14}/> Recibo</a></div>}</td></tr>)}</tbody></table></div></section>}
   {reschedule&&<div className="modal-backdrop"><div className="modal">
     <h2>Reprogramar reserva</h2>
     <p className="muted">{reschedule.providerName} · {reschedule.serviceName}. TUCITA permite una sola reprogramación por reserva.</p>
     {!resData?<div className="notice">Cargando horarios disponibles…</div>:<>
       <div className="field"><label>Selecciona el día</label><div className="date-tabs">{resData.availability.map((a:any)=><button type="button" key={a.id} className={'date-tab '+(resDate===a.date?'active':'')} onClick={()=>{setResDate(a.date);setResStart(a.slots.find((s:any)=>s.available)?.startsAt||'')}}><strong>{new Date(a.date+'T12:00:00').toLocaleDateString('es-VE',{weekday:'short',day:'2-digit'})}</strong><div className="muted" style={{fontSize:11}}>{new Date(a.date+'T12:00:00').toLocaleDateString('es-VE',{month:'short'})}</div></button>)}</div></div>
       <div className="field"><label>Selecciona la hora</label><div className="booking-slots">{resData.availability.find((a:any)=>a.date===resDate)?.slots.map((s:any)=><button type="button" disabled={!s.available} className={resStart===s.startsAt?'selected':''} onClick={()=>setResStart(s.startsAt)} key={s.startsAt}>{s.time}</button>)}</div></div>
       {!resData.availability.some((a:any)=>a.slots.some((s:any)=>s.available))&&<div className="notice">No hay horarios disponibles por ahora.</div>}
     </>}
     <div className="button-row" style={{marginTop:18}}><button className="btn btn-primary" disabled={saving||!resStart} onClick={confirmReschedule}>{saving?'Guardando…':'Confirmar nueva fecha'}</button><button className="btn btn-secondary" onClick={()=>{setReschedule(null);setResData(null)}}>Cancelar</button></div>
   </div></div>}
   {msg&&<div className="toast">{msg}</div>}
 </main></div>;
}
