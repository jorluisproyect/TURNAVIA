'use client';

import { useEffect,useMemo,useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
import { StatusPill } from '@/components/StatusPill';
import { CheckCircle2, Eye, FileText, MapPin, XCircle } from 'lucide-react';

const labels:any={PAYMENT_REVIEW:'Pago en revisión',PAYMENT_REJECTED:'Pago rechazado',CONFIRMED:'Confirmada',ON_THE_WAY:'En camino',ARRIVED:'Llegó',IN_CONSULTATION:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asistió'};

export default function PagosReservasProfesional(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  const load=()=>fetch('/api/me/provider',{cache:'no-store'}).then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
    if(!ok){setError(j.error||'No se pudieron cargar tus reservas.');return}
    setData(j);setError('');
  }).catch(()=>setError('No se pudo conectar con TUCITA.'));

  useEffect(()=>{load()},[]);

  async function patch(action:string,id:string,status?:string){
    const key=action+id;
    if(busy)return;
    setBusy(key);setMsg(action==='approve_payment'?'Aprobando pago…':action==='reject_payment'?'Rechazando pago…':'Guardando cambio…');
    try{
      const r=await fetch('/api/me/provider',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action,id,status})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo completar la acción.');return}
      setMsg(j.message||'Cambios guardados correctamente.');await load();
    }catch{setMsg('No se pudo conectar con TUCITA.')}
    finally{setBusy('');setTimeout(()=>setMsg(''),2500)}
  }

  const appointments=useMemo(()=>((data?.appointments||[]) as any[]).sort((a,b)=>new Date(b.startsAt).getTime()-new Date(a.startsAt).getTime()),[data]);
  const pending=appointments.filter(a=>a.status==='PAYMENT_REVIEW');
  const active=appointments.filter(a=>['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION'].includes(a.status));

  return <div className="dashboard"><Sidebar role="medico"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Pagos y reservas</h1><div className="muted" style={{fontSize:13,marginTop:5}}>Primero ves lo que requiere tu aprobación.</div></div></div>

    <div className="stat-grid">
      <div className="stat"><small>Por revisar</small><div className="n">{pending.length}</div></div>
      <div className="stat"><small>Reservas activas</small><div className="n">{active.length}</div></div>
      <div className="stat"><small>Total visible</small><div className="n">{appointments.length}</div></div>
    </div>

    {error&&<div className="notice danger">{error}</div>}
    {!data&&!error&&<div className="notice">Cargando pagos y reservas…</div>}

    {data&&<section className="panel payments-priority-panel">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Requieren tu confirmación</h2><div className="muted" style={{fontSize:13}}>Aprueba o rechaza los comprobantes pendientes sin buscar dentro de toda la agenda.</div></div><span className="pill">{pending.length} pendiente{pending.length===1?'':'s'}</span></div>
      {pending.length===0?<div className="notice" style={{marginTop:12}}>No tienes pagos pendientes de revisión.</div>:<div className="payment-review-grid">
        {pending.map((a:any)=><article className="payment-review-card" key={a.id}>
          <div className="row space" style={{gap:10,alignItems:'flex-start'}}><div><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.serviceName}</div></div><StatusPill tone="warn">Pago en revisión</StatusPill></div>
          <div className="payment-review-meta">
            <span>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Caracas'})}</span>
            <span><MapPin size={12}/>{a.location?.name||'Ubicación'}</span>
            <span><strong>{a.currency} {a.price}</strong> · {a.paymentMethod||'Método no indicado'}</span>
            {a.paymentReference&&<span>Ref: <strong>{a.paymentReference}</strong></span>}
          </div>
          <div className="button-row">
            {a.paymentProofUrl&&<a className="btn btn-secondary" target="_blank" rel="noreferrer" href={a.paymentProofUrl}><Eye size={14}/> Ver comprobante</a>}
            <button className="btn btn-primary" onClick={()=>patch('approve_payment',a.id)} disabled={!!busy}><CheckCircle2 size={15}/> {busy==='approve_payment'+a.id?'Aprobando…':'Aprobar'}</button>
            <button className="btn btn-secondary" onClick={()=>patch('reject_payment',a.id)} disabled={!!busy}><XCircle size={15}/> {busy==='reject_payment'+a.id?'Rechazando…':'Rechazar'}</button>
          </div>
        </article>)}
      </div>}
    </section>}

    {data&&<section className="panel" style={{marginTop:18}}>
      <h2>Todas las reservas</h2>
      {appointments.length===0?<div className="notice">Todavía no tienes reservas.</div>:<div className="professional-booking-list">
        {appointments.map((a:any)=><article className="professional-booking-row" key={a.id}>
          <div><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.clientEmail} · {a.clientPhone}</div></div>
          <div><strong>{a.serviceName}</strong><div className="muted" style={{fontSize:12}}>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}</div></div>
          <div><StatusPill tone={a.status==='PAYMENT_REVIEW'?'warn':a.status==='PAYMENT_REJECTED'?'bad':['CONFIRMED','COMPLETED','ARRIVED','IN_CONSULTATION'].includes(a.status)?'ok':''}>{labels[a.status]||a.status}</StatusPill></div>
          <div className="row" style={{gap:6,flexWrap:'wrap'}}>
            {a.status==='CONFIRMED'&&<button className="btn btn-secondary" onClick={()=>patch('appointment_status',a.id,'ARRIVED')} disabled={!!busy}>Llegó</button>}
            {a.status==='ARRIVED'&&<button className="btn btn-secondary" onClick={()=>patch('appointment_status',a.id,'IN_CONSULTATION')} disabled={!!busy}>Atender</button>}
            {a.status==='IN_CONSULTATION'&&<button className="btn btn-primary" onClick={()=>patch('appointment_status',a.id,'COMPLETED')} disabled={!!busy}>Completar</button>}
            {a.receiptNumber&&['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)&&<a className="btn btn-secondary" href={'/api/appointments/'+a.id+'/receipt'} target="_blank" rel="noreferrer"><FileText size={14}/> Recibo</a>}
          </div>
        </article>)}
      </div>}
    </section>}

    {data&&<section className="panel" style={{marginTop:18}}>
      <h2>Métodos de pago</h2>
      <div className="muted" style={{fontSize:13,marginBottom:12}}>Configura aquí cómo recibirás los pagos de tus clientes.</div>
      <PaymentMethodsManager scope="DOCTOR" slug={data.provider.slug} country={data.provider.location?.country||'Venezuela'}/>
    </section>}
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
