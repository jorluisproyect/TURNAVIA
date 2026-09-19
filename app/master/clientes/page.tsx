import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function ClientesMaster(){
 const rows=sql?await sql`SELECT id,name,type,category,subcategory,email,phone,status,trial_ends_at,created_at FROM commercial_clients ORDER BY created_at DESC`:[];
 return <div className="dashboard"><Sidebar role="master"/><main className="main"><div className="topbar"><div><div className="muted" style={{fontSize:13}}>Administración</div><h1>Clientes</h1></div><Link href="/activar" className="btn btn-primary">Nueva prueba</Link></div><section className="panel">{rows.length===0?<div className="notice">Todavía no hay clientes registrados.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Prueba</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td><strong>{r.name}</strong><div className="muted" style={{fontSize:12}}>{r.email} · {r.phone}</div></td><td>{r.category||'—'}<div className="muted" style={{fontSize:12}}>{r.subcategory||''}</div></td><td>{r.type}</td><td><span className="pill">{r.status}</span></td><td>{r.trial_ends_at?new Date(r.trial_ends_at).toLocaleDateString('es-VE'):'—'}</td></tr>)}</tbody></table></div>}</section></main></div>;
}