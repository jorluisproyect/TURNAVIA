import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
export const dynamic='force-dynamic';
export default async function SuscripcionesMaster(){
 const rows=sql?await sql`SELECT name,type,status,trial_ends_at,payment_method,payment_reference,payment_submitted_at,payment_reviewed_at FROM commercial_clients ORDER BY created_at DESC`:[];
 const active=rows.filter((r:any)=>r.status==='ACTIVO').length;
 const trial=rows.filter((r:any)=>r.status==='TRIAL').length;
 const review=rows.filter((r:any)=>r.status==='REVISION_BINANCE').length;
 return <div className="dashboard"><Sidebar role="master"/><main className="main"><div className="topbar"><div><div className="muted" style={{fontSize:13}}>Cobros TURNAVIA</div><h1>Suscripciones</h1></div></div><div className="stat-grid"><div className="stat"><small>Activos</small><div className="n">{active}</div></div><div className="stat"><small>En prueba</small><div className="n">{trial}</div></div><div className="stat"><small>Pagos por revisar</small><div className="n">{review}</div></div><div className="stat"><small>Total</small><div className="n">{rows.length}</div></div></div><section className="panel" style={{marginTop:18}}><div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>Pago</th><th>Referencia</th></tr></thead><tbody>{rows.map((r:any,i:number)=><tr key={i}><td><strong>{r.name}</strong></td><td>{r.type}</td><td>{r.status}</td><td>{r.payment_method||'—'}</td><td>{r.payment_reference||'—'}</td></tr>)}</tbody></table></div></section></main></div>;
}