import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AlertTriangle, BellRing, Building2, CheckCircle2, Clock3, DollarSign, Eye, HeartPulse, UserPlus } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { sql, hasDatabase } from '@/lib/db';
import { neonAuthConfigured } from '@/lib/auth/config';
import MasterActions from './MasterActions';
import { refreshAllCommercialStatuses } from '@/lib/subscription';

export const dynamic='force-dynamic';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';
const labels:Record<ClientStatus,string>={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};
const tone=(s:ClientStatus)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';
const isDemo=(email:string)=>{const e=email.toLowerCase();return e.startsWith('demo@')||e.includes('.demo@')};

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
    hasProof:Boolean(r.payment_proof),paymentRejectionReason:r.payment_rejection_reason||'',
    demo:isDemo(String(r.email||''))
  }));
  const real=clients.filter(c=>!c.demo);
  const active=real.filter(c=>c.status==='ACTIVO');
  const professionals=active.filter(c=>c.type.startsWith('Profesional')).length;
  const businesses=active.filter(c=>c.type.startsWith('Negocio')).length;
  const trials=real.filter(c=>c.status==='TRIAL').length;
  const mrr=professionals*15+businesses*49;
  const reviews=real.filter(c=>c.status==='REVISION_BINANCE');
  const now=Date.now();
  const expiring=real.filter(c=>c.status==='TRIAL'&&c.trialEndsAt&&new Date(c.trialEndsAt).getTime()>=now&&new Date(c.trialEndsAt).getTime()<=now+86400000);
  const emailTransportReady=Boolean((process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS)||process.env.RESEND_API_KEY);
  const systemOk=hasDatabase&&neonAuthConfigured&&Boolean(process.env.NEON_AUTH_COOKIE_SECRET)&&Boolean(process.env.APP_URL)&&Boolean(process.env.EMAIL_FROM)&&emailTransportReady;

  return <div className="dashboard">
    <Sidebar role="master"/>
    <main className="main">
      <div className="topbar">
        <div><div className="muted" style={{fontSize:13}}>TUCITA · Administración comercial</div><h1>Panel Master</h1></div>
        <div className="row"><Link href="/activar" className="btn btn-primary"><UserPlus size={16}/> Nueva prueba</Link></div>
      </div>

      {!hasDatabase&&<div className="notice danger" style={{marginBottom:18}}><strong>Base de datos de producción no conectada.</strong><br/>El Master abrió correctamente, pero TUCITA no puede leer clientes, pagos ni profesionales hasta restablecer la conexión con Neon. <Link href="/master/configuracion">Abrir diagnóstico</Link>.</div>}

      <section className="panel" style={{marginBottom:18}}>
        <div className="row space" style={{gap:14,flexWrap:'wrap'}}>
          <div><span className="eyebrow"><BellRing size={15}/> CENTRO DE ALERTAS</span><h2 style={{marginTop:10}}>Estado comercial de hoy</h2></div>
          <span className={systemOk?'status ok':'status'}>{systemOk?'TUCITA operativo':'Revisar configuración'}</span>
        </div>
        <div className="grid-3" style={{marginTop:14}}>
          <Link href="/master/suscripciones?status=REVISION_BINANCE" className="notice" style={{textDecoration:'none'}}><strong>{reviews.length} pago{reviews.length===1?'':'s'} por revisar</strong><br/><span className="muted">Abrir bandeja de cobros</span></Link>
          <Link href="/master/clientes?status=TRIAL" className="notice" style={{textDecoration:'none'}}><strong>{expiring.length} prueba{expiring.length===1?'':'s'} vence{expiring.length===1?'':'n'} en 24 h</strong><br/><span className="muted">Dar seguimiento</span></Link>
          <Link href="/master/configuracion" className={systemOk?'notice':'notice danger'} style={{textDecoration:'none'}}>{systemOk?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>} <strong>{systemOk?'Conexiones críticas OK':'Hay una configuración pendiente'}</strong></Link>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat"><Building2 size={18}/><small style={{display:'block',marginTop:8}}>Negocios activos</small><div className="n">{businesses}</div></div>
        <div className="stat"><HeartPulse size={18}/><small style={{display:'block',marginTop:8}}>Profesionales activos</small><div className="n">{professionals}</div></div>
        <div className="stat"><Clock3 size={18}/><small style={{display:'block',marginTop:8}}>Pruebas reales</small><div className="n">{trials}</div></div>
        <div className="stat"><DollarSign size={18}/><small style={{display:'block',marginTop:8}}>MRR real</small><div className="n">${mrr}</div><small>No incluye demos</small></div>
      </div>

      <section className="panel">
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div><h2>Pagos por revisar</h2><div className="muted" style={{fontSize:13}}>Bandeja prioritaria: verifica referencia y comprobante antes de activar.</div></div>
          <Link href="/master/suscripciones?status=REVISION_BINANCE" className="btn btn-secondary">Ver suscripciones</Link>
        </div>
        {reviews.length===0?<div className="notice" style={{marginTop:16}}><CheckCircle2 size={17}/> No tienes pagos pendientes de revisión.</div>:
        <div style={{overflowX:'auto',marginTop:12}}><table className="table"><thead><tr><th>Cliente</th><th>Plan / monto</th><th>Método</th><th>Comprobante</th><th>Acción</th></tr></thead><tbody>{reviews.map(c=>{
          const renewal=Boolean(c.paymentReviewedAt);
          const amount=c.type.startsWith('Negocio')?(renewal?49:149):(renewal?15:40);
          return <tr key={c.id}>
            <td><Link href={'/master/clientes/'+c.id}><strong>{c.name}</strong></Link><div className="muted" style={{fontSize:12}}>{c.email} · {c.phone}</div></td>
            <td>{c.type}<div><strong>USD {amount}</strong></div></td>
            <td>{c.paymentMethod||'—'}{c.paymentReference&&<div><strong>Ref: {c.paymentReference}</strong></div>}{c.paymentSubmittedAt&&<div className="muted" style={{fontSize:12}}>{new Date(c.paymentSubmittedAt).toLocaleString('es-VE')}</div>}</td>
            <td>{c.hasProof?<a className="btn btn-secondary" href={`/api/payments/proof?id=${c.id}`} target="_blank" rel="noreferrer"><Eye size={15}/> Ver comprobante</a>:<span className="muted">Sin archivo</span>}</td>
            <td><MasterActions id={c.id} status={c.status}/></td>
          </tr>
        })}</tbody></table></div>}
      </section>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Clientes recientes</h2><div className="muted" style={{fontSize:13}}>Los demos se muestran, pero no cuentan en tus métricas reales.</div></div><Link href="/master/clientes" className="btn btn-secondary">Ver todos</Link></div>
        {clients.length===0?<div className="notice" style={{marginTop:16}}>Aún no hay profesionales o negocios registrados como clientes.</div>:
        <div style={{overflowX:'auto',marginTop:12}}><table className="table"><thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{clients.slice(0,8).map(c=><tr key={c.id}>
          <td><Link href={'/master/clientes/'+c.id}><strong>{c.name}</strong></Link>{c.demo&&<span className="pill" style={{marginLeft:8}}>Demo</span>}<div className="muted" style={{fontSize:12}}>{c.email}</div></td>
          <td>{c.type}<div className="muted" style={{fontSize:12}}>{c.category}{c.subcategory?` · ${c.subcategory}`:''}</div></td>
          <td><StatusPill tone={tone(c.status)}>{labels[c.status]||c.status}</StatusPill></td>
          <td><Link href={'/master/clientes/'+c.id} className="btn btn-secondary">Abrir ficha</Link></td>
        </tr>)}</tbody></table></div>}
      </section>
    </main>
  </div>;
}
