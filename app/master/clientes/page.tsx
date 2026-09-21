import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { Search } from 'lucide-react';

export const dynamic='force-dynamic';

const labels:any={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};

export default async function ClientesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const q=String(sp.q||'').trim().toLowerCase();
  const status=String(sp.status||'TODOS');
  const rows=sql?await sql`SELECT id,name,type,category,subcategory,email,phone,status,trial_ends_at,created_at FROM commercial_clients ORDER BY created_at DESC`:[];
  const filtered=(rows as any[]).filter(r=>{
    const hay=[r.name,r.email,r.phone,r.category,r.subcategory,r.type].filter(Boolean).join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(status==='TODOS'||String(r.status)===status);
  });
  const real=filtered.filter((r:any)=>!String(r.email||'').toLowerCase().endsWith('@turnavia.app'));

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Administración</div><h1>Clientes</h1></div><Link href="/activar" className="btn btn-primary">Nueva prueba</Link></div>

    <section className="panel">
      <form method="get" className="row" style={{gap:10,flexWrap:'wrap',alignItems:'end'}}>
        <div className="field" style={{flex:1,minWidth:240}}><label>Buscar</label><div style={{position:'relative'}}><Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/><input name="q" defaultValue={String(sp.q||'')} placeholder="Nombre, correo, teléfono o rubro" style={{paddingLeft:38}}/></div></div>
        <div className="field" style={{minWidth:210}}><label>Estado</label><select name="status" defaultValue={status}><option value="TODOS">Todos</option><option value="ACTIVO">Activo</option><option value="TRIAL">Prueba</option><option value="REVISION_BINANCE">Pago en revisión</option><option value="PAGO_PENDIENTE">Pago pendiente</option><option value="SUSPENDIDO">Suspendido</option></select></div>
        <button className="btn btn-primary" type="submit">Filtrar</button>
        <Link className="btn btn-secondary" href="/master/clientes">Limpiar</Link>
      </form>
      <div className="muted" style={{fontSize:12,marginTop:10}}>{real.length} cliente{real.length===1?'':'s'} real{real.length===1?'':'es'} en este resultado.</div>
    </section>

    <section className="panel" style={{marginTop:18}}>{filtered.length===0?<div className="notice">No encontramos clientes con esos filtros.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Prueba</th><th>Acción</th></tr></thead><tbody>{filtered.map((r:any)=>{
      const demo=String(r.email||'').toLowerCase().endsWith('@turnavia.app');
      return <tr key={r.id}><td><strong>{r.name}</strong>{demo&&<span className="pill" style={{marginLeft:8}}>Demo</span>}<div className="muted" style={{fontSize:12}}>{r.email} · {r.phone}</div></td><td>{r.category||'—'}<div className="muted" style={{fontSize:12}}>{r.subcategory||''}</div></td><td>{r.type}</td><td><span className="pill">{labels[r.status]||r.status}</span></td><td>{r.trial_ends_at?new Date(r.trial_ends_at).toLocaleDateString('es-VE'):'—'}</td><td><Link href={'/master/clientes/'+r.id} className="btn btn-secondary">Abrir ficha</Link></td></tr>
    })}</tbody></table></div>}</section>
  </main></div>;
}
