import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AlertTriangle, BellRing, Building2, CheckCircle2, Clock3, DollarSign, Eye, HeartPulse, UserPlus, UserRound } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { sql, hasDatabase } from '@/lib/db';
import { neonAuthConfigured } from '@/lib/auth/config';
import MasterActions from './MasterActions';
import { refreshAllCommercialStatuses } from '@/lib/subscription';
import { currentSession, isOwnerMasterSession } from '@/lib/access';
import { teamMemberForUser } from '@/lib/master-team';
import TeamMasterDashboard from './TeamMasterDashboard';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';
const labels:Record<ClientStatus,string>={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};
const tone=(s:ClientStatus)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';
const isDemo=(email:string)=>{const e=email.toLowerCase();return e.startsWith('demo@')||e.includes('.demo@')};

export default async function Master(){
  if(!(await isOwnerMasterSession())){
    const session=await currentSession();
    const member=await teamMemberForUser(session?.user as any);
    if(!member)redirect('/panel');
    return <TeamMasterDashboard member={member}/>;
  }
  await refreshAllCommercialStatuses();
  const professionalRows=sql?await sql`SELECT
      ap.email,
      ap.full_name,
      ap.phone,
      d.public_slug,
      d.provider_category,
      d.provider_activity,
      d.provider_type,
      COALESCE(cc.status,'SIN_SUSCRIPCION') AS commercial_status
    FROM app_user_profiles ap
    LEFT JOIN users u ON lower(u.email)=lower(ap.email)
    LEFT JOIN doctors d ON d.user_id=u.id
    LEFT JOIN LATERAL (
      SELECT status
      FROM commercial_clients c
      WHERE lower(c.email)=lower(ap.email)
      ORDER BY c.created_at DESC
      LIMIT 1
    ) cc ON true
    WHERE ap.role::text='DOCTOR'
      AND COALESCE((
        SELECT ae.action
        FROM audit_events ae
        WHERE ae.entity_type='ACCOUNT_PROFILE'
          AND ae.action IN ('PROFILE_DELETED','PROFILE_RESTORED')
          AND lower(ae.metadata->>'email')=lower(ap.email)
        ORDER BY ae.created_at DESC,ae.id DESC
        LIMIT 1
      ),'')<>'PROFILE_DELETED'
    ORDER BY ap.full_name,ap.email`:[];
  const registeredProfessionals=(professionalRows as any[]).filter(r=>!isDemo(String(r.email||'')));
  const totalProfessionals=registeredProfessionals.length;

  const rows=sql ? await sql`SELECT c.*,
    (SELECT e.metadata FROM audit_events e WHERE e.action='PAYMENT_SUBMITTED' AND e.entity_type='COMMERCIAL_CLIENT' AND e.entity_id=c.id::text ORDER BY e.id DESC LIMIT 1) AS pending_payment,
    (SELECT e.metadata FROM audit_events e WHERE e.action='PAYMENT_APPROVED' AND e.entity_type='COMMERCIAL_CLIENT' AND e.entity_id=c.id::text ORDER BY e.id DESC LIMIT 1) AS latest_approval
    FROM commercial_clients c ORDER BY c.created_at DESC` : [];
  const clients=rows.map((r:any)=>({
    id:String(r.id),name:r.name||'Sin nombre',type:r.type||'—',category:r.category||'',subcategory:r.subcategory||'',specialty:r.specialty||'',phone:r.phone||'—',email:r.email||'—',
    status:(r.status||'TRIAL') as ClientStatus,
    trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,
    paymentMethod:r.payment_method||'',paymentReference:r.payment_reference||'',
    paymentSubmittedAt:r.payment_submitted_at?new Date(r.payment_submitted_at).toISOString():undefined,
    paymentReviewedAt:r.payment_reviewed_at?new Date(r.payment_reviewed_at).toISOString():undefined,
    hasProof:Boolean(r.payment_proof),paymentRejectionReason:r.payment_rejection_reason||'',
    pendingPayment:r.pending_payment||null,latestApproval:r.latest_approval||null,
    demo:isDemo(String(r.email||''))
  }));
  const real=clients.filter(c=>!c.demo);
  const active=real.filter(c=>c.status==='ACTIVO');
  const professionals=active.filter(c=>c.type.startsWith('Profesional')).length;
  const businesses=active.filter(c=>c.type.startsWith('Negocio')).length;
  const trials=real.filter(c=>c.status==='TRIAL').length;
  const mrr=active.reduce((n,c)=>n+(c.type.startsWith('Negocio')?49:(Number(c.latestApproval?.billingMonths)===12?125/12:15)),0);
  const reviews=real.filter(c=>c.status==='REVISION_BINANCE');
  const now=Date.now();
  const expiring=real.filter(c=>c.status==='TRIAL'&&c.trialEndsAt&&new Date(c.trialEndsAt).getTime()>=now&&new Date(c.trialEndsAt).getTime()<=now+86400000);
  const emailTransportReady=Boolean((process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS)||process.env.RESEND_API_KEY);
  const systemOk=hasDatabase&&neonAuthConfigured&&Boolean(process.env.NEON_AUTH_COOKIE_SECRET)&&Boolean(process.env.APP_URL)&&Boolean(process.env.EMAIL_FROM)&&emailTransportReady;

  const analytics=sql?await sql`
    SELECT
      (SELECT count(DISTINCT lower(c.email))::int
       FROM commercial_clients c
       WHERE lower(c.email) NOT LIKE 'demo@%'
         AND lower(c.email) NOT LIKE '%.demo@%') AS trials_started,
      (SELECT count(DISTINCT c.id)::int
       FROM commercial_clients c
       WHERE lower(c.email) NOT LIKE 'demo@%'
         AND lower(c.email) NOT LIKE '%.demo@%'
         AND (
           c.payment_reviewed_at IS NOT NULL
           OR EXISTS (
             SELECT 1 FROM audit_events ae
             WHERE ae.entity_type='COMMERCIAL_CLIENT'
               AND ae.entity_id=c.id::text
               AND ae.action='PAYMENT_APPROVED'
           )
         )) AS ever_paid,
      (SELECT count(*)::int FROM commercial_clients c
       WHERE c.status='ACTIVO'
         AND lower(c.email) NOT LIKE 'demo@%'
         AND lower(c.email) NOT LIKE '%.demo@%') AS active_now,
      (SELECT count(*)::int FROM app_user_profiles ap
       WHERE ap.role::text='PATIENT'
         AND COALESCE((
           SELECT ae.action FROM audit_events ae
           WHERE ae.entity_type='ACCOUNT_PROFILE'
             AND ae.action IN ('PROFILE_DELETED','PROFILE_RESTORED')
             AND lower(ae.metadata->>'email')=lower(ap.email)
           ORDER BY ae.created_at DESC,ae.id DESC LIMIT 1
         ),'')<>'PROFILE_DELETED'
         AND COALESCE((
           SELECT ae.action FROM audit_events ae
           WHERE ae.entity_type='MASTER_TEAM'
             AND lower(ae.entity_id)=lower(ap.email)
           ORDER BY ae.id DESC LIMIT 1
         ),'')<>'MASTER_TEAM_ACCEPTED') AS final_users,
      (SELECT count(*)::int FROM appointments) AS bookings_total,
      (SELECT count(*)::int FROM appointments
       WHERE starts_at>=date_trunc('month',now())
         AND starts_at<date_trunc('month',now())+interval '1 month') AS bookings_month,
      (SELECT count(*)::int FROM appointments WHERE status='COMPLETED') AS completed_total,
      (SELECT count(*)::int
       FROM app_user_profiles ap
       LEFT JOIN users u ON lower(u.email)=lower(ap.email)
       LEFT JOIN doctors d ON d.user_id=u.id
       LEFT JOIN commercial_clients c ON lower(c.email)=lower(ap.email)
       WHERE ap.role::text='DOCTOR'
         AND (u.id IS NULL OR d.id IS NULL OR c.id IS NULL)) AS unsynced_professionals,
      (SELECT count(*)::int
       FROM app_user_profiles ap
       LEFT JOIN patients p ON p.auth_user_id=ap.auth_user_id OR lower(COALESCE(p.email,''))=lower(ap.email)
       WHERE ap.role::text='PATIENT'
         AND p.id IS NULL
         AND COALESCE((
           SELECT ae.action FROM audit_events ae
           WHERE ae.entity_type='MASTER_TEAM'
             AND lower(ae.entity_id)=lower(ap.email)
           ORDER BY ae.id DESC LIMIT 1
         ),'')<>'MASTER_TEAM_ACCEPTED') AS unsynced_clients
  `:[];
  const a=(analytics[0] as any)||{};
  const trialsStarted=Number(a.trials_started||0);
  const everPaid=Number(a.ever_paid||0);
  const activeNow=Number(a.active_now||0);
  const finalUsers=Number(a.final_users||0);
  const bookingsTotal=Number(a.bookings_total||0);
  const bookingsMonth=Number(a.bookings_month||0);
  const completedTotal=Number(a.completed_total||0);
  const syncIssues=Number(a.unsynced_professionals||0)+Number(a.unsynced_clients||0);
  const conversion=trialsStarted>0?Math.round((everPaid/trialsStarted)*100):0;

  const trendRows=sql?await sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month',now())-interval '5 months',
        date_trunc('month',now()),
        interval '1 month'
      ) AS month_start
    )
    SELECT
      to_char(m.month_start,'Mon') AS month_label,
      extract(month from m.month_start)::int AS month_number,
      (SELECT count(DISTINCT lower(c.email))::int
       FROM commercial_clients c
       WHERE c.created_at>=m.month_start
         AND c.created_at<m.month_start+interval '1 month'
         AND lower(c.email) NOT LIKE 'demo@%'
         AND lower(c.email) NOT LIKE '%.demo@%') AS trials,
      (SELECT count(DISTINCT ae.entity_id)::int
       FROM audit_events ae
       JOIN commercial_clients c ON c.id::text=ae.entity_id
       WHERE ae.action='PAYMENT_APPROVED'
         AND ae.entity_type='COMMERCIAL_CLIENT'
         AND ae.created_at>=m.month_start
         AND ae.created_at<m.month_start+interval '1 month'
         AND lower(c.email) NOT LIKE 'demo@%'
         AND lower(c.email) NOT LIKE '%.demo@%') AS purchases,
      (SELECT count(*)::int
       FROM appointments ap
       WHERE ap.created_at>=m.month_start
         AND ap.created_at<m.month_start+interval '1 month') AS bookings
    FROM months m
    ORDER BY m.month_start`:[];
  const trend=(trendRows as any[]).map((r:any)=>({
    month:String(r.month_label||''),
    trials:Number(r.trials||0),
    purchases:Number(r.purchases||0),
    bookings:Number(r.bookings||0)
  }));
  const trendMax=Math.max(1,...trend.flatMap((r:any)=>[r.trials,r.purchases,r.bookings]));

  return <div className="dashboard">
    <Sidebar role="master"/>
    <main className="main">
      <div className="topbar">
        <div><div className="muted" style={{fontSize:13}}>TUCITA · Administración comercial</div><h1>Panel Master</h1></div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}><Link href="/activar" className="btn btn-primary"><UserPlus size={16}/> Nueva prueba</Link><Link href="/master/suscripciones?status=REVISION_BINANCE" className="btn btn-secondary"><DollarSign size={16}/> Pagos</Link><Link href="/master/usuarios" className="btn btn-secondary"><UserRound size={16}/> Usuarios</Link></div>
      </div>

      {!hasDatabase&&<div className="notice danger" style={{marginBottom:18}}><strong>Base de datos de producción no conectada.</strong><br/>El Master abrió correctamente, pero TUCITA no puede leer clientes, pagos ni profesionales hasta restablecer la conexión con Neon. <Link href="/master/configuracion">Abrir diagnóstico</Link>.</div>}

      <section id="alertas" className="panel" style={{marginBottom:18}}>
        <div className="row space" style={{gap:14,flexWrap:'wrap'}}>
          <div><span className="eyebrow"><BellRing size={15}/> CENTRO DE ALERTAS</span><h2 style={{marginTop:10}}>Estado comercial de hoy</h2></div>
          <span className={systemOk?'status ok':'status'}>{systemOk?'TUCITA operativo':'Revisar configuración'}</span>
        </div>
        <div className="grid-3" style={{marginTop:14}}>
          <Link href="/master/suscripciones?status=REVISION_BINANCE" className="notice" style={{textDecoration:'none'}}><strong>{reviews.length} pago{reviews.length===1?'':'s'} por revisar</strong><br/><span className="muted">Abrir bandeja de cobros</span></Link>
          <Link href="/master/profesionales?status=TRIAL" className="notice" style={{textDecoration:'none'}}><strong>{expiring.length} prueba{expiring.length===1?'':'s'} vence{expiring.length===1?'':'n'} en 24 h</strong><br/><span className="muted">Dar seguimiento</span></Link>
          <Link href="/master/configuracion" className={systemOk?'notice':'notice danger'} style={{textDecoration:'none'}}>{systemOk?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>} <strong>{systemOk?'Conexiones críticas OK':'Hay una configuración pendiente'}</strong></Link>
        </div>
      </section>

      <section className="master-growth-panel" aria-label="Crecimiento TUCITA">
        <div className="master-growth-head">
          <div>
            <span className="eyebrow">MI PANEL VISUAL</span>
            <h2>Crecimiento de TUCITA</h2>
            <p>Pruebas, compras y uso real de la plataforma. Demos excluidos.</p>
          </div>
          <div className={syncIssues===0?'master-sync-ok':'master-sync-warn'}>
            <span className="master-sync-dot"/>
            {syncIssues===0?'Todo sincronizado':syncIssues+' cuenta'+(syncIssues===1?'':'s')+' por revisar'}
          </div>
        </div>

        <div className="master-kpi-grid">
          <Link href="/master/profesionales" className="master-kpi-card">
            <small>Probaron TUCITA</small>
            <strong>{trialsStarted}</strong>
            <span>Profesionales / negocios</span>
          </Link>
          <Link href="/master/suscripciones" className="master-kpi-card">
            <small>Compraron</small>
            <strong>{everPaid}</strong>
            <span>Han tenido un pago aprobado</span>
          </Link>
          <div className="master-kpi-card master-kpi-accent">
            <small>Conversión</small>
            <strong>{conversion}%</strong>
            <span>Prueba → compra</span>
          </div>
          <Link href="/master/suscripciones?status=ACTIVO" className="master-kpi-card">
            <small>Activos ahora</small>
            <strong>{activeNow}</strong>
            <span>Suscripciones vigentes</span>
          </Link>
        </div>

        <div className="master-growth-grid">
          <div className="master-chart-card">
            <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
              <div><strong>Evolución · 6 meses</strong><div className="muted" style={{fontSize:12}}>Pruebas, compras y reservas creadas.</div></div>
              <div className="master-chart-legend"><span><i className="trial"/>Pruebas</span><span><i className="purchase"/>Compras</span><span><i className="booking"/>Reservas</span></div>
            </div>
            <div className="master-bars" aria-label="Gráfica de evolución de seis meses">
              {trend.map((r:any)=><div className="master-bar-month" key={r.month}>
                <div className="master-bar-stack">
                  <span className="master-bar trial" style={{height:Math.max(4,Math.round((r.trials/trendMax)*120))}} title={r.trials+' pruebas'}/>
                  <span className="master-bar purchase" style={{height:Math.max(4,Math.round((r.purchases/trendMax)*120))}} title={r.purchases+' compras'}/>
                  <span className="master-bar booking" style={{height:Math.max(4,Math.round((r.bookings/trendMax)*120))}} title={r.bookings+' reservas'}/>
                </div>
                <small>{r.month}</small>
              </div>)}
            </div>
          </div>

          <div className="master-pulse-card">
            <div><strong>Pulso de uso</strong><div className="muted" style={{fontSize:12}}>Lo que está pasando dentro de TUCITA.</div></div>
            <Link href="/master/usuarios" className="master-pulse-row"><span>Usuarios finales</span><strong>{finalUsers}</strong></Link>
            <div className="master-pulse-row"><span>Reservas totales</span><strong>{bookingsTotal}</strong></div>
            <div className="master-pulse-row"><span>Reservas este mes</span><strong>{bookingsMonth}</strong></div>
            <div className="master-pulse-row"><span>Servicios completados</span><strong>{completedTotal}</strong></div>
            {syncIssues>0&&<div className="notice danger" style={{marginTop:8}}>
              <strong>{syncIssues} cuenta{syncIssues===1?'':'s'} incompleta{syncIssues===1?'':'s'}</strong><br/>
              <span>Revisa Profesionales y Usuarios finales. TUCITA ya no las oculta.</span>
            </div>}
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <Link href="/master/profesionales" className="stat" style={{textDecoration:'none',color:'inherit'}}><HeartPulse size={18}/><small style={{display:'block',marginTop:8}}>Profesionales registrados</small><div className="n">{totalProfessionals}</div><small>{professionals} activos</small></Link>
        <div className="stat"><Building2 size={18}/><small style={{display:'block',marginTop:8}}>Negocios activos</small><div className="n">{businesses}</div></div>
        <div className="stat"><Clock3 size={18}/><small style={{display:'block',marginTop:8}}>Pruebas reales</small><div className="n">{trials}</div></div>
        <div className="stat"><DollarSign size={18}/><small style={{display:'block',marginTop:8}}>MRR equivalente</small><div className="n">${mrr.toFixed(2)}</div><small>No incluye demos</small></div>
      </div>

      <section className="panel">
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div><h2>Pagos por revisar</h2><div className="muted" style={{fontSize:13}}>Bandeja prioritaria: verifica referencia y comprobante antes de activar.</div></div>
          <Link href="/master/suscripciones?status=REVISION_BINANCE" className="btn btn-secondary">Ver suscripciones</Link>
        </div>
        {reviews.length===0?<div className="notice" style={{marginTop:16}}><CheckCircle2 size={17}/> No tienes pagos pendientes de revisión.</div>:
        <div style={{overflowX:'auto',marginTop:12}}><table className="table"><thead><tr><th>Cliente</th><th>Plan / monto</th><th>Método</th><th>Comprobante</th><th>Acción</th></tr></thead><tbody>{reviews.map(c=>{
          const renewal=Boolean(c.paymentReviewedAt);
          const audited=Number(c.pendingPayment?.amount||0);
          const amount=audited>0?audited:c.type.startsWith('Negocio')?(renewal?49:149):(renewal?15:40);
          const cycle=Number(c.pendingPayment?.billingMonths||1);
          return <tr key={c.id}>
            <td><Link href={'/master/clientes/'+c.id}><strong>{c.name}</strong></Link><div className="muted" style={{fontSize:12}}>{c.email} · {c.phone}</div></td>
            <td>{c.type}<div><strong>USD {amount}</strong> · {cycle===12?'1 año':cycle===3?'3 meses':'1 mes'}</div></td>
            <td>{c.paymentMethod||'—'}{c.paymentReference&&<div><strong>Ref: {c.paymentReference}</strong></div>}{c.paymentSubmittedAt&&<div className="muted" style={{fontSize:12}}>{new Date(c.paymentSubmittedAt).toLocaleString('es-VE')}</div>}</td>
            <td>{c.hasProof?<a className="btn btn-secondary" href={`/api/payments/proof?id=${c.id}`} target="_blank" rel="noreferrer"><Eye size={15}/> Ver comprobante</a>:<span className="muted">Sin archivo</span>}</td>
            <td><MasterActions id={c.id} status={c.status}/></td>
          </tr>
        })}</tbody></table></div>}
      </section>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div><h2>Profesionales registrados</h2><div className="muted" style={{fontSize:13}}>Todos los profesionales creados aparecen aquí, aunque estén en prueba, pendientes de pago o todavía no estén activos.</div></div>
          <Link href="/master/profesionales" className="btn btn-secondary">Ver todos</Link>
        </div>
        {registeredProfessionals.length===0
          ?<div className="notice" style={{marginTop:16}}>Todavía no hay profesionales registrados.</div>
          :<div style={{overflowX:'auto',marginTop:12}}>
            <table className="table">
              <thead><tr><th>Profesional</th><th>Rubro</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>{registeredProfessionals.slice(0,8).map((p:any)=><tr key={p.email}>
                <td><strong>{p.full_name||'Sin nombre'}</strong><div className="muted" style={{fontSize:12}}>{p.email}{p.phone?' · '+p.phone:''}</div></td>
                <td>{p.provider_category||'Pendiente'}<div className="muted" style={{fontSize:12}}>{p.provider_activity||p.provider_type||'Perfil en creación'}</div></td>
                <td><span className="pill">{labels[p.commercial_status as ClientStatus]||p.commercial_status}</span></td>
                <td>{p.public_slug?<a href={'/reservar/'+p.public_slug} target="_blank" rel="noreferrer" className="btn btn-secondary">Ver página</a>:<Link href="/master/profesionales" className="btn btn-secondary">Revisar</Link>}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </section>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Cuentas comerciales recientes</h2><div className="muted" style={{fontSize:13}}>Profesionales y negocios creados en el módulo comercial. Los demos no cuentan en tus métricas reales.</div></div><Link href="/master/clientes" className="btn btn-secondary">Ver cuentas</Link></div>
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
