import { isOwnerMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { Search, UserRound, ExternalLink, Phone, Mail } from 'lucide-react';
import { parseProviderMedia } from '@/lib/provider-media';

export const dynamic='force-dynamic';

const labels:any={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};

export default async function ClientesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  if(!(await isOwnerMasterSession()))redirect('/master');
  const sp=await searchParams;
  const q=String(sp.q||'').trim().toLowerCase();
  const status=String(sp.status||'TODOS');
  const rows=sql?await sql`SELECT c.id,c.name,c.type,c.category,c.subcategory,c.email,c.phone,c.status,c.trial_ends_at,c.created_at,
      d.provider_activity,d.provider_category,d.public_slug,d.bio
    FROM commercial_clients c
    LEFT JOIN users u ON lower(u.email)=lower(c.email)
    LEFT JOIN doctors d ON d.user_id=u.id
    WHERE COALESCE((
      SELECT ae.action
      FROM audit_events ae
      WHERE ae.entity_type='ACCOUNT_PROFILE'
        AND ae.action IN ('PROFILE_DELETED','PROFILE_RESTORED')
        AND lower(ae.metadata->>'email')=lower(c.email)
      ORDER BY ae.created_at DESC,ae.id DESC
      LIMIT 1
    ),'')<>'PROFILE_DELETED'
    ORDER BY c.created_at DESC`:[];
  const filtered=(rows as any[]).filter(r=>{
    const hay=[r.name,r.email,r.phone,r.category,r.subcategory,r.type,r.provider_activity,r.provider_category].filter(Boolean).join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(status==='TODOS'||String(r.status)===status);
  });
  const real=filtered.filter((r:any)=>!String(r.email||'').toLowerCase().includes('demo'));

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

    <section className="panel" style={{marginTop:18}}>
      {filtered.length===0?<div className="notice">No encontramos clientes con esos filtros.</div>:
      <div className="grid-3">{filtered.map((r:any)=>{
        const demo=String(r.email||'').toLowerCase().includes('demo');
        const media=parseProviderMedia(r.bio);
        const profession=r.provider_activity||r.subcategory||r.category||'Profesional';
        return <article className="card" key={r.id} style={{display:'grid',gap:12}}>
          <div className="row" style={{gap:12,alignItems:'center'}}>
            {media.profileImage?<img src={media.profileImage} alt="" style={{width:64,height:64,borderRadius:18,objectFit:'cover',flex:'0 0 auto'}}/>:<div className="profile-avatar" style={{width:64,height:64,flex:'0 0 auto'}}><UserRound size={26}/></div>}
            <div style={{minWidth:0}}><div className="row" style={{gap:6,flexWrap:'wrap'}}><strong>{r.name}</strong>{demo&&<span className="pill">Demo</span>}</div><div className="muted" style={{fontSize:13,marginTop:3}}>{profession}</div><div className="muted" style={{fontSize:12}}>{r.provider_category||r.category||'—'}</div></div>
          </div>
          <div className="row space" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{labels[r.status]||r.status}</span><span className="muted" style={{fontSize:12}}>{r.type}</span></div>
          <div style={{display:'grid',gap:6,fontSize:13}}><div className="row" style={{gap:7}}><Mail size={14}/><span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{r.email}</span></div><div className="row" style={{gap:7}}><Phone size={14}/><span>{r.phone||'—'}</span></div></div>
          <div className="muted" style={{fontSize:12}}>Prueba: {r.trial_ends_at?new Date(r.trial_ends_at).toLocaleDateString('es-VE'):'—'}</div>
          <div className="button-row" style={{flexWrap:'wrap'}}><Link href={'/master/clientes/'+r.id} className="btn btn-primary">Abrir ficha</Link>{r.public_slug&&<a href={'/reservar/'+r.public_slug} target="_blank" rel="noreferrer" className="btn btn-secondary"><ExternalLink size={14}/> Página</a>}</div>
        </article>
      })}</div>}
    </section>
  </main></div>;
}
