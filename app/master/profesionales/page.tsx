import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { Search } from 'lucide-react';
import ProfessionalActions from './ProfessionalActions';

export const dynamic='force-dynamic';
const labels:any={TRIAL:'Prueba',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido',DEMO:'Demo'};

export default async function ProfesionalesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const q=String(sp.q||'').trim().toLowerCase();
  const status=String(sp.status||'TODOS');
  const rows=sql?await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.accepts_online_booking,u.full_name,u.email,u.phone,u.active,
    COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services,
    COALESCE(cc.status,CASE WHEN lower(COALESCE(u.email,'')) LIKE '%@turnavia.app' THEN 'DEMO' ELSE 'SIN_SUSCRIPCION' END) AS commercial_status,
    cc.id AS commercial_client_id
    FROM doctors d
    JOIN users u ON u.id=d.user_id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    LEFT JOIN LATERAL (
      SELECT id,status FROM commercial_clients c
      WHERE lower(c.email)=lower(u.email)
      ORDER BY c.created_at DESC LIMIT 1
    ) cc ON true
    GROUP BY d.id,u.full_name,u.email,u.phone,cc.status,cc.id
    ORDER BY u.full_name`:[];
  const filtered=(rows as any[]).filter(r=>{
    const hay=[r.full_name,r.email,r.phone,r.provider_category,r.provider_activity,r.provider_type].filter(Boolean).join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(status==='TODOS'||String(r.commercial_status)===status);
  });
  const realCount=filtered.filter((r:any)=>String(r.commercial_status)!=='DEMO').length;

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Red TURNAVIA</div><h1>Profesionales y negocios</h1></div></div>
    <section className="panel">
      <form method="get" className="row" style={{gap:10,flexWrap:'wrap',alignItems:'end'}}>
        <div className="field" style={{flex:1,minWidth:240}}><label>Buscar</label><div style={{position:'relative'}}><Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/><input name="q" defaultValue={String(sp.q||'')} placeholder="Nombre, correo o rubro" style={{paddingLeft:38}}/></div></div>
        <div className="field" style={{minWidth:210}}><label>Estado</label><select name="status" defaultValue={status}><option value="TODOS">Todos</option><option value="ACTIVO">Activo</option><option value="TRIAL">Prueba</option><option value="REVISION_BINANCE">Pago en revisión</option><option value="PAGO_PENDIENTE">Pago pendiente</option><option value="SUSPENDIDO">Suspendido</option><option value="DEMO">Solo demo</option></select></div>
        <button className="btn btn-primary" type="submit">Filtrar</button><Link className="btn btn-secondary" href="/master/profesionales">Limpiar</Link>
      </form>
      <div className="muted" style={{fontSize:12,marginTop:10}}>{realCount} profesional{realCount===1?'':'es'} real{realCount===1?'':'es'} en el resultado. Los demos no cuentan en métricas.</div>
    </section>

    <section className="panel" style={{marginTop:18}}>{filtered.length===0?<div className="notice">No hay profesionales con esos filtros.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Nombre</th><th>Rubro</th><th>Tipo</th><th>Servicios</th><th>Estado</th><th>Reserva pública</th><th>Administrar</th></tr></thead><tbody>{filtered.map((r:any)=><tr key={r.public_slug}><td><strong>{r.full_name}</strong>{String(r.commercial_status)==='DEMO'&&<span className="pill" style={{marginLeft:8}}>Demo</span>}<div className="muted" style={{fontSize:12}}>{r.email} · {r.phone}</div></td><td>{r.provider_category}<div className="muted" style={{fontSize:12}}>{r.provider_activity}</div></td><td>{r.provider_type}</td><td>{r.services}</td><td><span className="pill">{labels[r.commercial_status]||r.commercial_status}</span>{r.commercial_client_id&&<div style={{marginTop:6}}><Link href={'/master/clientes/'+r.commercial_client_id} className="muted" style={{fontSize:12}}>Abrir ficha comercial</Link></div>}</td><td>{r.accepts_online_booking&&r.active?<a className="btn btn-secondary" href={'/reservar/'+r.public_slug} target="_blank" rel="noreferrer">Ver página</a>:<span className="muted">Pausada</span>}</td><td><ProfessionalActions slug={r.public_slug} active={Boolean(r.active)} name={r.full_name}/></td></tr>)}</tbody></table></div>}</section>
  </main></div>;
}
