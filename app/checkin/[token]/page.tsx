'use client';
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2,MapPin,ScanLine } from 'lucide-react';

export default function CheckinPage(){
 const params=useParams<{token:string}>();
 const token=String(params?.token||'');const [data,setData]=useState<any>(null);const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);const busyRef=useRef(false);
 async function load(t=token){if(!t)return;const r=await fetch('/api/checkin/'+encodeURIComponent(t));const j=await r.json();if(!r.ok){setMsg(j.error||'No se pudo validar el QR');return}setData(j.appointment);setMsg('')}
 useEffect(()=>{if(token)load(token)},[token]);
 async function action(action:string){
  if(busyRef.current)return;
  busyRef.current=true;setBusy(true);setMsg('Procesando cambio…');
  try{
   const r=await fetch('/api/checkin/'+encodeURIComponent(token),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});
   const j=await r.json();
   if(!r.ok){setMsg(j.error||'No se pudo actualizar.');return}
   await load(token);setMsg('Cambio realizado correctamente.');setTimeout(()=>setMsg(''),2200);
  }catch{
   setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
  }finally{
   busyRef.current=false;setBusy(false);
  }
 }
 if(!data)return <main className="demo-chooser"><div className="container booking-wrap"><div className="profile-card"><h1>Validando QR TUCITA…</h1>{msg&&<div className="notice" role="status" aria-live="polite">{msg}</div>}</div></div></main>;
 const loc=[data.location?.name,data.location?.address,data.location?.city,data.location?.state].filter(Boolean).join(' · ');
 return <main className="demo-chooser"><div className="container booking-wrap">
  <div className="profile-card">
   <span className="eyebrow"><ScanLine size={15}/> CONTROL DE CITA TUCITA</span>
   <h1 style={{marginTop:12}}>{data.clientName}</h1>
   <div className="notice"><strong>{data.serviceName}</strong><br/>{new Date(data.startsAt).toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'})}<br/><span className="row" style={{marginTop:6}}><MapPin size={15}/>{loc||'Ubicación por confirmar'}</span>{data.location?.room&&<><br/><strong>{data.location.room}</strong></>}</div>
   <div className="notice" style={{marginTop:12}}><strong>Recibo:</strong> {data.receiptNumber}<br/><strong>Estado:</strong> {data.status}<br/><strong>Teléfono:</strong> {data.clientPhone||'—'}<br/><strong>Pago:</strong> {data.currency} {data.price} · {data.paymentMethod||'—'}{data.paymentReference?' · Ref. '+data.paymentReference:''}</div>
   {msg&&<div className="notice danger">{msg}</div>}
   <div className="button-row" style={{marginTop:18,flexWrap:'wrap'}}>
    {['CONFIRMED','ON_THE_WAY'].includes(data.status)&&<button className="btn btn-primary" disabled={busy} onClick={()=>action('arrive')}><CheckCircle2 size={16}/> {busy?'Procesando…':'Registrar llegada'}</button>}
    {data.status==='ARRIVED'&&<button className="btn btn-primary" disabled={busy} onClick={()=>action('start')}>{busy?'Procesando…':'Iniciar atención'}</button>}
    {['ARRIVED','IN_CONSULTATION'].includes(data.status)&&<button className="btn btn-secondary" disabled={busy} onClick={()=>action('complete')}>{busy?'Procesando…':'Marcar servicio completado'}</button>}
    {data.status==='COMPLETED'&&<span className="status ok">Servicio completado ✓</span>}
    <Link href="/panel" className="btn btn-secondary">Volver al panel</Link>
   </div>
  </div>
 </div></main>;
}
