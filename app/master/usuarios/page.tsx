import { isOwnerMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { CalendarDays, Search, UserRound, LayoutGrid, List } from 'lucide-react';
import RepairFinalUserButton from './RepairFinalUserButton';
import FinalUserDeleteButton from './FinalUserDeleteButton';

export const dynamic='force-dynamic';

export default async function UsuariosFinalesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  if(!(await isOwnerMasterSession()))redirect('/master');
  const sp=await searchParams;
  const q=String(sp.q||'').trim().toLowerCase();
  const view=String(sp.view||'list')==='cards'?'cards':'list';

  const rows=sql?await sql`
    SELECT
      ap.auth_user_id,
      ap.full_name AS profile_name,
      ap.email AS profile_email,
      ap.phone AS profile_phone,
      p.id AS patient_id,
      p.full_name AS patient_name,
      p.email AS patient_email,
      p.phone AS patient_phone,
      p.created_at,
      u.id AS internal_user_id,
      COALESCE(u.active,true) AS active,
      COALESCE(stats.bookings,0)::int AS bookings,
      stats.last_booking
    FROM app_user_profiles ap
    LEFT JOIN LATERAL (
      SELECT p.*
      FROM patients p
      WHERE p.auth_user_id=ap.auth_user_id
         OR (COALESCE(p.email,'')<>'' AND lower(p.email)=lower(ap.email))
      ORDER BY p.created_at DESC
      LIMIT 1
    ) p ON true
    LEFT JOIN users u ON
      (p.user_id IS NOT NULL AND u.id=p.user_id)
      OR (p.user_id IS NULL AND lower(COALESCE(u.email,''))=lower(ap.email))
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS bookings,max(a.starts_at) AS last_booking
      FROM appointments a
      WHERE p.id IS NOT NULL AND a.patient_id=p.id
    ) stats ON true
    WHERE ap.role::text='PATIENT'
      AND COALESCE((
        SELECT ae.action
        FROM audit_events ae
        WHERE ae.entity_type='ACCOUNT_PROFILE'
          AND ae.action IN ('PROFILE_DELETED','PROFILE_RESTORED')
          AND lower(ae.metadata->>'email')=lower(ap.email)
        ORDER BY ae.created_at DESC,ae.id DESC
        LIMIT 1
      ),'')<>'PROFILE_DELETED'
      AND COALESCE((
        SELECT ae.action
        FROM audit_events ae
        WHERE ae.entity_type='MASTER_TEAM'
          AND lower(ae.entity_id)=lower(ap.email)
        ORDER BY ae.id DESC
        LIMIT 1
      ),'')<>'MASTER_TEAM_ACCEPTED'
    ORDER BY COALESCE(p.created_at,now()) DESC,ap.full_name` : [];

  const users=(rows as any[]).map(r=>({
    ...r,
    name:r.patient_name||r.profile_name||'Sin nombre',
    email:r.patient_email||r.profile_email||'—',
    phone:r.patient_phone||r.profile_phone||'—'
  }));
  const filtered=users.filter(r=>{
    const hay=[r.name,r.email,r.phone].filter(Boolean).join(' ').toLowerCase();
    return !q||hay.includes(q);
  });

  const withBookings=filtered.filter(r=>Number(r.bookings||0)>0).length;

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar">
      <div><div className="muted" style={{fontSize:13}}>TUCITA · Personas que reservan</div><h1>Usuarios finales</h1></div>
      <span className="pill">{filtered.length} usuario{filtered.length===1?'':'s'}</span>
    </div>

    <section className="panel">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div>
          <h2>Clientes que usan los servicios</h2>
          <p className="muted">Aquí aparecen las personas que crean una cuenta para reservar con profesionales. No son suscripciones de TUCITA.</p>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
          <span className="pill">{withBookings} con reservas</span>
          <Link href="/master/eliminados" className="btn btn-secondary">Perfiles eliminados</Link>
        </div>
      </div>
      <div className="row space" style={{gap:12,flexWrap:'wrap',marginTop:14}}>
        <div className="muted" style={{fontSize:12}}>Vista de usuarios</div>
        <div className="master-view-toggle">
          <Link href={'/master/usuarios?view=list'+(q?'&q='+encodeURIComponent(q):'')} className={view==='list'?'active':''}><List size={14}/> Lista</Link>
          <Link href={'/master/usuarios?view=cards'+(q?'&q='+encodeURIComponent(q):'')} className={view==='cards'?'active':''}><LayoutGrid size={14}/> Tarjetas</Link>
        </div>
      </div>
      <form method="get" className="row" style={{gap:10,flexWrap:'wrap',alignItems:'end',marginTop:14}}>
        <div className="field" style={{flex:1,minWidth:240}}>
          <label>Buscar usuario</label>
          <div style={{position:'relative'}}>
            <Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
            <input name="q" defaultValue={String(sp.q||'')} placeholder="Nombre, correo o teléfono" style={{paddingLeft:38}}/>
          </div>
        </div>
        <button className="btn btn-primary" type="submit">Buscar</button>
        <Link className="btn btn-secondary" href="/master/usuarios">Limpiar</Link>
      </form>
    </section>

    <section className="panel" style={{marginTop:18}}>
      {filtered.length===0?<div className="notice">Todavía no hay usuarios finales registrados con esos filtros.</div>:
      view==='cards'?<div className="master-final-user-grid">{filtered.map((r:any)=><article className="master-final-user-card" key={String(r.auth_user_id||r.email)}>
        <div className="row space" style={{alignItems:'flex-start',gap:10}}>
          <div className="iconbox"><UserRound size={20}/></div>
          <span className={r.active?'status ok':'status bad'}>{r.active?'Activo':'Inactivo'}</span>
        </div>
        <div>
          <h3>{r.name}</h3>
          <div className="muted" style={{fontSize:12,wordBreak:'break-word'}}>{r.email}</div>
          <div className="muted" style={{fontSize:12}}>{r.phone}</div>
        </div>
        <div className="master-final-user-stats">
          <div><strong>{Number(r.bookings||0)}</strong><small>Reservas</small></div>
          <div><strong>{r.last_booking?new Date(r.last_booking).toLocaleDateString('es-VE'):'—'}</strong><small>Última</small></div>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
          {(!r.patient_id||!r.internal_user_id)?<RepairFinalUserButton authUserId={String(r.auth_user_id)} email={String(r.profile_email||r.email)} name={String(r.profile_name||r.name)}/>:<span className="status ok">Sincronizado</span>}
          <FinalUserDeleteButton email={String(r.email)} name={String(r.name)}/>
        </div>
      </article>)}</div>:
      <div style={{overflowX:'auto'}}>
        <table className="table">
          <thead><tr><th>Usuario</th><th>Estado</th><th>Reservas</th><th>Última reserva</th><th>Cuenta</th><th>Acción</th></tr></thead>
          <tbody>{filtered.map((r:any)=><tr key={String(r.auth_user_id||r.email)}>
            <td>
              <div className="row" style={{gap:9}}>
                <div className="iconbox" style={{width:38,height:38}}><UserRound size={17}/></div>
                <div><strong>{r.name}</strong><div className="muted" style={{fontSize:12}}>{r.email} · {r.phone}</div></div>
              </div>
            </td>
            <td><span className={r.active?'status ok':'status bad'}>{r.active?'Activo':'Inactivo'}</span></td>
            <td><strong>{Number(r.bookings||0)}</strong></td>
            <td>{r.last_booking?<><CalendarDays size={14} style={{verticalAlign:'middle',marginRight:5}}/>{new Date(r.last_booking).toLocaleString('es-VE')}</>:'Sin reservas'}</td>
            <td><span className="muted" style={{fontSize:12}}>El usuario puede eliminar su perfil. El Master controla restauración o borrado definitivo desde Perfiles eliminados.</span></td>
            <td><div className="row" style={{gap:8,flexWrap:'wrap'}}>
              {(!r.patient_id||!r.internal_user_id)
                ?<RepairFinalUserButton authUserId={String(r.auth_user_id)} email={String(r.profile_email||r.email)} name={String(r.profile_name||r.name)}/>
                :<span className="status ok">Sincronizado</span>}
              <FinalUserDeleteButton email={String(r.email)} name={String(r.name)}/>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </main></div>;
}
