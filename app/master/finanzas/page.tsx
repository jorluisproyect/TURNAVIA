import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { isOwnerMasterSession } from '@/lib/access';
import { sql } from '@/lib/db';
import { DollarSign, LockKeyhole, TrendingUp, WalletCards } from 'lucide-react';

export const dynamic='force-dynamic';

const isDemo=(email:string)=>{
  const e=String(email||'').toLowerCase();
  return e.startsWith('demo@')||e.includes('.demo@');
};

export default async function MasterFinanzas(){
  // Segunda barrera: aunque el layout Master admita colaboradores,
  // esta página exige la cuenta Master propietaria exacta.
  if(!(await isOwnerMasterSession()))redirect('/master');

  const clients=sql?await sql`
    SELECT c.*,
      (
        SELECT ae.metadata
        FROM audit_events ae
        WHERE ae.entity_type='COMMERCIAL_CLIENT'
          AND ae.entity_id=c.id::text
          AND ae.action='PAYMENT_APPROVED'
        ORDER BY ae.id DESC
        LIMIT 1
      ) AS latest_approval
    FROM commercial_clients c
    ORDER BY c.created_at DESC` : [];

  const real=(clients as any[]).filter(r=>!isDemo(String(r.email||'')));
  const active=real.filter(r=>String(r.status)==='ACTIVO');
  const mrr=active.reduce((sum:number,r:any)=>{
    const months=Number(r.latest_approval?.billingMonths||1);
    if(String(r.type||'').startsWith('Negocio'))return sum+49;
    if(months===12)return sum+(125/12);
    return sum+15;
  },0);

  const revenueRows=sql?await sql`
    WITH approvals AS (
      SELECT ae.id,ae.entity_id,ae.created_at,
        (
          SELECT NULLIF(ps.metadata->>'amount','')::numeric
          FROM audit_events ps
          WHERE ps.entity_type='COMMERCIAL_CLIENT'
            AND ps.entity_id=ae.entity_id
            AND ps.action='PAYMENT_SUBMITTED'
            AND ps.id<ae.id
          ORDER BY ps.id DESC
          LIMIT 1
        ) AS amount
      FROM audit_events ae
      JOIN commercial_clients c ON c.id::text=ae.entity_id
      WHERE ae.entity_type='COMMERCIAL_CLIENT'
        AND ae.action='PAYMENT_APPROVED'
        AND lower(c.email) NOT LIKE 'demo@%'
        AND lower(c.email) NOT LIKE '%.demo@%'
    )
    SELECT
      COALESCE(sum(amount),0)::numeric AS total_approved,
      COALESCE(sum(amount) FILTER (
        WHERE created_at>=date_trunc('month',now())
          AND created_at<date_trunc('month',now())+interval '1 month'
      ),0)::numeric AS approved_this_month,
      count(*) FILTER (WHERE amount IS NOT NULL)::int AS approved_payments
    FROM approvals` : [];

  const rev=(revenueRows[0] as any)||{};
  const totalApproved=Number(rev.total_approved||0);
  const approvedThisMonth=Number(rev.approved_this_month||0);
  const approvedPayments=Number(rev.approved_payments||0);

  const trendRows=sql?await sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month',now())-interval '5 months',
        date_trunc('month',now()),
        interval '1 month'
      ) AS month_start
    ),
    approvals AS (
      SELECT ae.id,ae.entity_id,ae.created_at,
        (
          SELECT NULLIF(ps.metadata->>'amount','')::numeric
          FROM audit_events ps
          WHERE ps.entity_type='COMMERCIAL_CLIENT'
            AND ps.entity_id=ae.entity_id
            AND ps.action='PAYMENT_SUBMITTED'
            AND ps.id<ae.id
          ORDER BY ps.id DESC
          LIMIT 1
        ) AS amount
      FROM audit_events ae
      JOIN commercial_clients c ON c.id::text=ae.entity_id
      WHERE ae.entity_type='COMMERCIAL_CLIENT'
        AND ae.action='PAYMENT_APPROVED'
        AND lower(c.email) NOT LIKE 'demo@%'
        AND lower(c.email) NOT LIKE '%.demo@%'
    )
    SELECT
      to_char(m.month_start,'Mon') AS month,
      COALESCE(sum(a.amount),0)::numeric AS revenue,
      count(a.id)::int AS approvals
    FROM months m
    LEFT JOIN approvals a
      ON a.created_at>=m.month_start
     AND a.created_at<m.month_start+interval '1 month'
    GROUP BY m.month_start
    ORDER BY m.month_start` : [];

  const trend=(trendRows as any[]).map((r:any)=>({
    month:String(r.month||''),
    revenue:Number(r.revenue||0),
    approvals:Number(r.approvals||0)
  }));
  const maxRevenue=Math.max(1,...trend.map((r:any)=>r.revenue));

  return <div className="dashboard">
    <Sidebar role="master"/>
    <main className="main">
      <div className="topbar">
        <div>
          <div className="muted" style={{fontSize:13}}>TUCITA · Solo Master propietario</div>
          <h1>Finanzas</h1>
        </div>
        <span className="status ok"><LockKeyhole size={14}/> Privado</span>
      </div>

      <div className="notice" style={{marginBottom:18}}>
        <LockKeyhole size={17}/> Esta sección exige tu sesión de <strong>Master propietario</strong>. Los colaboradores Master no pueden abrirla ni ver estos valores.
      </div>

      <div className="stat-grid">
        <div className="stat"><TrendingUp size={18}/><small style={{display:'block',marginTop:8}}>MRR equivalente</small><div className="n">${mrr.toFixed(2)}</div><small>Suscripciones activas</small></div>
        <div className="stat"><DollarSign size={18}/><small style={{display:'block',marginTop:8}}>Aprobado este mes</small><div className="n">${approvedThisMonth.toFixed(2)}</div><small>Pagos aprobados</small></div>
        <div className="stat"><WalletCards size={18}/><small style={{display:'block',marginTop:8}}>Ingresos aprobados</small><div className="n">${totalApproved.toFixed(2)}</div><small>Histórico registrado</small></div>
        <div className="stat"><WalletCards size={18}/><small style={{display:'block',marginTop:8}}>Suscripciones activas</small><div className="n">{active.length}</div><small>{approvedPayments} pagos aprobados registrados</small></div>
      </div>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div>
            <h2>Ingresos aprobados · 6 meses</h2>
            <div className="muted" style={{fontSize:13}}>Se calcula con pagos enviados y posteriormente aprobados. Demos excluidos.</div>
          </div>
          <Link href="/master/suscripciones" className="btn btn-secondary">Ver suscripciones</Link>
        </div>
        <div className="master-bars" style={{marginTop:20}}>
          {trend.map((r:any)=><div className="master-bar-month" key={r.month}>
            <div className="master-bar-stack">
              <span className="master-bar purchase" style={{height:Math.max(4,Math.round((r.revenue/maxRevenue)*120)),width:22}} title={'USD '+r.revenue.toFixed(2)+' · '+r.approvals+' pagos'}/>
            </div>
            <small>{r.month}</small>
          </div>)}
        </div>
      </section>

      <section className="panel" style={{marginTop:18}}>
        <h2>Acceso financiero</h2>
        <p className="muted">El Resumen Master ya no muestra cifras monetarias. La información de dinero queda centralizada aquí y en Suscripciones, ambas reservadas al Master propietario.</p>
      </section>
    </main>
  </div>;
}
