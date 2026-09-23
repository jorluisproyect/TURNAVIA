import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { RestoreProfileButton } from '@/components/RestoreProfileButton';
import { PermanentDeleteProfileButton } from '@/components/PermanentDeleteProfileButton';
import { isOwnerMasterSession } from '@/lib/access';
import { sql } from '@/lib/db';
import { Trash2, UserRound } from 'lucide-react';

export const dynamic='force-dynamic';

export default async function PerfilesEliminados(){
  if(!(await isOwnerMasterSession()))redirect('/master');
  const rows=sql?await sql`
    WITH latest AS (
      SELECT DISTINCT ON (lower(metadata->>'email'))
        action,metadata,created_at,id
      FROM audit_events
      WHERE entity_type='ACCOUNT_PROFILE'
        AND action IN ('PROFILE_DELETED','PROFILE_RESTORED')
        AND COALESCE(metadata->>'email','')<>''
      ORDER BY lower(metadata->>'email'),created_at DESC,id DESC
    )
    SELECT action,metadata,created_at
    FROM latest
    WHERE action='PROFILE_DELETED'
    ORDER BY created_at DESC` : [];

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Master · Recuperación</div><h1>Perfiles eliminados</h1></div></div>
    <section className="panel">
      <div className="row" style={{gap:10,alignItems:'flex-start'}}><Trash2 size={20}/><div><strong>Solo tú puedes ver esta sección.</strong><div className="muted" style={{fontSize:13,marginTop:4}}><strong>Eliminar</strong> conserva el perfil para poder restablecerlo. <strong>Eliminar por completo</strong> es definitivo y borra la cuenta del sistema. Las suscripciones profesionales eliminadas no se recuperan.</div></div></div>
    </section>
    <section className="panel" style={{marginTop:18}}>
      {rows.length===0?<div className="notice">No hay perfiles eliminados.</div>:<div className="grid-3">{(rows as any[]).map((r:any)=>{
        const m=r.metadata||{};
        const professional=Boolean(m.professional);
        const role=String(m.role||'PATIENT');
        return <article className="card" key={String(m.email)}>
          <div className="row space" style={{gap:10}}><div className="iconbox"><UserRound size={20}/></div><span className="pill">{professional?(String(m.previousCommercialStatus||'')==='ACTIVO'?'Profesional · suscripción perdida':'Profesional'):'Cliente'}</span></div>
          <h3>{m.name||m.email}</h3>
          <p className="muted" style={{wordBreak:'break-word'}}>{m.email}</p>
          <div className="muted" style={{fontSize:12}}>Rol anterior: {role}<br/>Eliminado: {new Date(r.created_at).toLocaleString('es-VE')}</div>
          {Boolean(m.hadActiveSubscription)&&<div className="notice danger" style={{marginTop:10,fontSize:12}}>La suscripción activa se perdió al eliminar el perfil.</div>}
          <div className="button-row" style={{marginTop:14,alignItems:'flex-start'}}>
            <RestoreProfileButton email={String(m.email)} name={String(m.name||m.email)} professional={professional}/>
            <PermanentDeleteProfileButton email={String(m.email)} name={String(m.name||m.email)}/>
          </div>
        </article>
      })}</div>}
    </section>
  </main></div>;
}
