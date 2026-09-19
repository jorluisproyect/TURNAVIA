import { Sidebar } from '@/components/Sidebar';
import { StatusPill } from '@/components/StatusPill';
import { sql } from '@/lib/db';
import { refreshAllCommercialStatuses } from '@/lib/subscription';

export const dynamic='force-dynamic';

const labels:any={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};
const tone=(s:string)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';

export default async function SuscripcionesMaster(){
 await refreshAllCommercialStatuses();
 const rows=sql?await sql`SELECT id,name,type,status,trial_ends_at,payment_method,payment_reference,payment_submitted_at,payment_reviewed_at,payment_rejection_reason FROM commercial_clients ORDER BY created_at DESC`:[];
 const active=rows.filter((r:any)=>r.status==='ACTIVO').length;
 const trial=rows.filter((r:any)=>r.status==='TRIAL').length;
 const review=rows.filter((r:any)=>r.status==='REVISION_BINANCE').length;
 const pending=rows.filter((r:any)=>r.status==='PAGO_PENDIENTE').length;
 const mrr=rows.filter((r:any)=>r.status==='ACTIVO').reduce((n:number,r:any)=>n+(String(r.type).startsWith('Negocio')?49:15),0);

 return <div className="dashboard"><Sidebar role="master"/><main className="main">
  <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Cobros TURNAVIA</div><h1>Suscripciones</h1></div></div>
  <div className="stat-grid">
    <div className="stat"><small>Activos</small><div className="n">{active}</div></div>
    <div className="stat"><small>En prueba</small><div className="n">{trial}</div></div>
    <div className="stat"><small>Pagos por revisar</small><div className="n">{review}</div></div>
    <div className="stat"><small>MRR activo</small><div className="n">${mrr}</div><small>{pending} pendientes</small></div>
  </div>
  <section className="panel" style={{marginTop:18}}>
    <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Ciclo / prueba</th><th>Pago</th><th>Referencia</th></tr></thead><tbody>{rows.map((r:any)=><tr key={String(r.id)}>
      <td><strong>{r.name}</strong></td>
      <td>{r.type}<div className="muted" style={{fontSize:12}}>{String(r.type).startsWith('Negocio')?'$49/mes':'$15/mes'}</div></td>
      <td><StatusPill tone={tone(r.status)}>{labels[r.status]||r.status}</StatusPill>{r.payment_rejection_reason&&<div className="muted" style={{fontSize:11,marginTop:4}}>{r.payment_rejection_reason}</div>}</td>
      <td>{r.status==='TRIAL'&&r.trial_ends_at?<>Hasta {new Date(r.trial_ends_at).toLocaleDateString('es-VE')}</>:r.status==='ACTIVO'&&r.payment_reviewed_at?<>Renueva aprox. {new Date(new Date(r.payment_reviewed_at).getTime()+31*86400000).toLocaleDateString('es-VE')}</>:'—'}</td>
      <td>{r.payment_method||'—'}{r.payment_submitted_at&&<div className="muted" style={{fontSize:11}}>Enviado {new Date(r.payment_submitted_at).toLocaleDateString('es-VE')}</div>}</td>
      <td>{r.payment_reference||'—'}</td>
    </tr>)}</tbody></table></div>
  </section>
 </main></div>;
}
