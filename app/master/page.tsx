import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Building2, HeartPulse, DollarSign, CheckCircle2, UserPlus, Clock3, Eye } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { sql } from '@/lib/db';
import MasterActions from './MasterActions';
import { refreshAllCommercialStatuses } from '@/lib/subscription';

export const dynamic='force-dynamic';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';
const labels:Record<ClientStatus,string>={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};

export default async function Master(){
  await refreshAllCommercialStatuses();
  const rows=sql ? await sql`SELECT * FROM commercial_clients ORDER BY created_at DESC` : [];
  const clients=rows.map((r:any)=>({
    id:String(r.id),name:r.name||'Sin nombre',type:r.type||'—',category:r.category||'',subcategory:r.subcategory||'',specialty:r.specialty||'',phone:r.phone||'—',email:r.email||'—',
    status:(r.status||'TRIAL') as ClientStatus,
    trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,
    paymentMethod:r.payment_method||'',paymentReference:r.payment_reference||'',
    paymentSubmittedAt:r.payment_submitted_at?new Date(r.payment_submitted_at).toISOString():undefined,
    paymentReviewedAt:r.payment_reviewed_at?new Date(r.payment_reviewed_at).toISOString():undefined,
    hasProof:Boolean(r.payment_proof),paymentRejectionReason:r.payment_rejection_reason||''
  }));
  const active=clients.filter(c=>c.status==='ACTIVO');
  const professionals=active.filter(c=>c.type.startsWith('Profesional')).length;
  const businesses=active.filter(c=>c.type.startsWith('Negocio')).length;
  const trials=clients.filter(c=>c.status==='TRIAL').length;
  const mrr=professionals*15+businesses*49;
  const tone=(s:ClientStatus)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';

  return <div className="dashboard">
    <Sidebar role="master"/>
    <main className="main">
      <div className="topbar">
        <div><div className="muted" style={{fontSize:13}}>TURNAVIA · Administración comercial</div><h1>Panel Master</h1></div>
        <div className="row"><Link href="/activar" className="btn btn-primary"><UserPlus size={16}/> Nueva prueba</Link></div>
      </div>

      <div className="stat-grid">
        <div className="stat"><Building2 size={18}/><small style={{display:'block',marginTop:8}}>Negocios activos</small><div className="n">{businesses}</div></div>
        <div className="stat"><HeartPulse size={18}/><small style={{display:'block',marginTop:8}}>Profesionales activos</small><div className="n">{professionals}</div></div>
        <div className="stat"><Clock3 size={18}/><small style={{display:'block',marginTop:8}}>Pruebas de 5 días</small><div className="n">{trials}</div></div>
        <div className="stat"><DollarSign size={18}/><small style={{display:'block',marginTop:8}}>MRR actual</small><div className="n">${mrr}</div></div>
      </div>

      <section className="panel">
        <div className="row space"><div><h2>Clientes, pruebas y pagos</h2><div className="muted" style={{fontSize:13}}>Verifica referencia y comprobante antes de aprobar.</div></div><span className="pill"><CheckCircle2 size={14}/> Solo Master</span></div>
        {clients.length===0 ? <div className="notice" style={{marginTop:16}}>Aún no hay profesionales o negocios registrados como clientes.</div> :
        <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Plan</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{clients.map(c=><tr key={c.id}>
          <td><strong>{c.name}</strong><div className="muted" style={{fontSize:12}}>{c.email} · {c.phone}</div>{c.trialEndsAt&&c.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Prueba hasta {new Date(c.trialEndsAt).toLocaleDateString('es-VE')}</div>}</td>
          <td>{c.type}<div className="muted" style={{fontSize:12}}>{c.category}{c.subcategory?` · ${c.subcategory}`:''}</div><div className="muted" style={{fontSize:12}}>{c.specialty}</div></td>
          <td>{c.paymentMethod||'—'}{c.paymentReference&&<div><strong>Ref: {c.paymentReference}</strong></div>}{c.paymentSubmittedAt&&<div className="muted" style={{fontSize:12}}>Enviado: {new Date(c.paymentSubmittedAt).toLocaleString('es-VE')}</div>}{c.hasProof&&<a className="btn btn-secondary" style={{marginTop:8}} href={`/api/payments/proof?id=${c.id}`} target="_blank" rel="noreferrer"><Eye size={15}/> Ver comprobante</a>}{c.paymentRejectionReason&&<div className="notice danger" style={{marginTop:8,fontSize:12}}>{c.paymentRejectionReason}</div>}</td>
          <td><StatusPill tone={tone(c.status)}>{labels[c.status]||c.status}</StatusPill>{c.status==='ACTIVO'&&c.paymentReviewedAt&&<div className="muted" style={{fontSize:12,marginTop:5}}>Renueva aprox. {new Date(new Date(c.paymentReviewedAt).getTime()+31*86400000).toLocaleDateString('es-VE')}</div>}</td>
          <td><MasterActions id={c.id} status={c.status}/></td>
        </tr>)}</tbody></table></div>}
      </section>

      <section className="panel" style={{marginTop:18}}>
        <h2>Regla comercial</h2>
        <p className="muted">5 días gratis sin tarjeta. Después: profesional independiente $40 inicial y $15/mes; negocio hasta 5 profesionales $149 inicial y $49/mes. PayPal y Binance se validan manualmente.</p>
      </section>
    </main>
  </div>;
}
