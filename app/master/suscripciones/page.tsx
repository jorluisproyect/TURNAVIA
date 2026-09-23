import { isOwnerMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { StatusPill } from '@/components/StatusPill';
import { sql } from '@/lib/db';
import { refreshAllCommercialStatuses } from '@/lib/subscription';
import Link from 'next/link';
import { Eye, Search } from 'lucide-react';
import MasterActions from '../MasterActions';

export const dynamic='force-dynamic';

const labels:any={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};
const tone=(s:string)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';

export default async function SuscripcionesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  if(!(await isOwnerMasterSession()))redirect('/master');
 await refreshAllCommercialStatuses();
 const sp=await searchParams;
 const q=String(sp.q||'').trim().toLowerCase();
 const status=String(sp.status||'TODOS');
 const rows=sql?await sql`SELECT c.*,(c.payment_proof IS NOT NULL) AS has_proof,
   (SELECT e.metadata FROM audit_events e WHERE e.entity_type='COMMERCIAL_CLIENT' AND e.entity_id=c.id::text AND e.action='PAYMENT_SUBMITTED' ORDER BY e.id DESC LIMIT 1) AS latest_payment,
   (SELECT e.metadata FROM audit_events e WHERE e.entity_type='COMMERCIAL_CLIENT' AND e.entity_id=c.id::text AND e.action='PAYMENT_APPROVED' ORDER BY e.id DESC LIMIT 1) AS latest_approval
   FROM commercial_clients c ORDER BY c.created_at DESC`:[];
 const filtered=(rows as any[]).filter(r=>{
   const hay=[r.name,r.email,r.type,r.payment_method,r.payment_reference].filter(Boolean).join(' ').toLowerCase();
   return (!q||hay.includes(q))&&(status==='TODOS'||String(r.status)===status);
 });
 const real=(rows as any[]).filter(r=>!String(r.email||'').toLowerCase().includes('demo'));
 const active=real.filter((r:any)=>r.status==='ACTIVO').length;
 const trial=real.filter((r:any)=>r.status==='TRIAL').length;
 const review=real.filter((r:any)=>r.status==='REVISION_BINANCE').length;
 const pending=real.filter((r:any)=>r.status==='PAGO_PENDIENTE').length;
 const mrr=real.filter((r:any)=>r.status==='ACTIVO').reduce((n:number,r:any)=>n+(String(r.type).startsWith('Negocio')?49:(Number(r.latest_approval?.billingMonths)===12?125/12:15)),0);

 return <div className="dashboard"><Sidebar role="master"/><main className="main">
  <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Cobros TUCITA</div><h1>Suscripciones</h1></div></div>
  <div className="stat-grid">
    <div className="stat"><small>Activos reales</small><div className="n">{active}</div></div>
    <div className="stat"><small>En prueba</small><div className="n">{trial}</div></div>
    <div className="stat"><small>Pagos por revisar</small><div className="n">{review}</div></div>
    <div className="stat"><small>MRR equivalente</small><div className="n">${mrr.toFixed(2)}</div><small>{pending} pendientes · demos excluidos</small></div>
  </div>

  <section className="panel" style={{marginTop:18}}>
    <form method="get" className="row" style={{gap:10,flexWrap:'wrap',alignItems:'end'}}>
      <div className="field" style={{flex:1,minWidth:240}}><label>Buscar</label><div style={{position:'relative'}}><Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/><input name="q" defaultValue={String(sp.q||'')} placeholder="Cliente, correo, método o referencia" style={{paddingLeft:38}}/></div></div>
      <div className="field" style={{minWidth:220}}><label>Estado</label><select name="status" defaultValue={status}><option value="TODOS">Todos</option><option value="ACTIVO">Activo</option><option value="TRIAL">Prueba</option><option value="REVISION_BINANCE">Pago en revisión</option><option value="PAGO_PENDIENTE">Pago pendiente</option><option value="SUSPENDIDO">Suspendido</option></select></div>
      <button className="btn btn-primary" type="submit">Filtrar</button><Link className="btn btn-secondary" href="/master/suscripciones">Limpiar</Link>
    </form>
  </section>

  <section className="panel" style={{marginTop:18}}>
    {filtered.length===0?<div className="notice">No hay suscripciones con esos filtros.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Ciclo / prueba</th><th>Pago</th><th>Referencia</th><th>Acción</th></tr></thead><tbody>{filtered.map((r:any)=>{
      const demo=String(r.email||'').toLowerCase().includes('demo');
      return <tr key={String(r.id)}>
      <td><Link href={'/master/clientes/'+r.id}><strong>{r.name}</strong></Link>{demo&&<span className="pill" style={{marginLeft:8}}>Demo</span>}<div className="muted" style={{fontSize:12}}>{r.email}</div></td>
      <td>{r.type}<div className="muted" style={{fontSize:12}}>{String(r.type).startsWith('Negocio')?'$49/mes':'$15/mes'} · {Number(r.latest_payment?.billingMonths||1)===12?'1 año':Number(r.latest_payment?.billingMonths||1)===3?'3 meses':'1 mes'}</div>{r.status==='REVISION_BINANCE'&&r.latest_payment?.amount&&<strong>USD {Number(r.latest_payment.amount)}</strong>}</td>
      <td><StatusPill tone={tone(r.status)}>{labels[r.status]||r.status}</StatusPill>{r.payment_rejection_reason&&<div className="muted" style={{fontSize:11,marginTop:4}}>{r.payment_rejection_reason}</div>}</td>
      <td>{r.status==='TRIAL'&&r.trial_ends_at?<>Hasta {new Date(r.trial_ends_at).toLocaleDateString('es-VE')}</>:r.status==='ACTIVO'&&(r.latest_approval?.paidUntil||r.payment_reviewed_at)?<>Vence {new Date(r.latest_approval?.paidUntil||new Date(new Date(r.payment_reviewed_at).getTime()+31*86400000)).toLocaleDateString('es-VE')}</>:'—'}</td>
      <td>{r.payment_method||'—'}{r.payment_submitted_at&&<div className="muted" style={{fontSize:11}}>Enviado {new Date(r.payment_submitted_at).toLocaleString('es-VE')}</div>}{r.has_proof&&<div style={{marginTop:6}}><a className="btn btn-secondary" href={'/api/payments/proof?id='+r.id} target="_blank" rel="noreferrer"><Eye size={14}/> Comprobante</a></div>}</td>
      <td>{r.payment_reference||'—'}</td>
      <td><MasterActions id={String(r.id)} status={r.status} showDeleteSubscription name={String(r.name||r.email||'esta cuenta')}/></td>
    </tr>})}</tbody></table></div>}
  </section>
 </main></div>;
}
