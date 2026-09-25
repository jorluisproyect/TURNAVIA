import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { sql } from '@/lib/db';
import Link from 'next/link';
import { Search, AlertTriangle, UserRound, ExternalLink, Mail, Phone, BriefcaseBusiness } from 'lucide-react';
import ProfessionalActions from './ProfessionalActions';
import RecoverProfessionalButton from './RecoverProfessionalButton';
import RepairProfessionalButton from './RepairProfessionalButton';
import ProfessionalViewToggle from './ProfessionalViewToggle';
import { parseProviderMedia } from '@/lib/provider-media';
import CredentialsReviewActions from './CredentialsReviewActions';

export const dynamic='force-dynamic';
const labels:any={
  TRIAL:'Prueba',
  PAGO_PENDIENTE:'Pago pendiente',
  REVISION_BINANCE:'Pago en revisión',
  ACTIVO:'Activo',
  SUSPENDIDO:'Suspendido',
  DEMO:'Demo',
  SIN_SUSCRIPCION:'Sin suscripción'
};

export default async function ProfesionalesMaster({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  if(!(await isOwnerMasterSession()))redirect('/master');
  const sp=await searchParams;
  const q=String(sp.q||'').trim().toLowerCase();
  const status=String(sp.status||'TODOS');
  const view=String(sp.view||'list')==='cards'?'cards':'list';

  const rows=sql?await sql`
    SELECT
      ap.auth_user_id,
      ap.full_name AS registered_name,
      ap.email AS registered_email,
      ap.phone AS registered_phone,
      d.public_slug,
      d.provider_category,
      d.provider_activity,
      d.provider_type,
      d.bio,
      d.accepts_online_booking,
      u.full_name,
      u.email,
      u.phone,
      u.active,
      COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services,
      COALESCE(
        cc.status,
        CASE WHEN lower(COALESCE(ap.email,'')) LIKE '%demo%' THEN 'DEMO' ELSE 'SIN_SUSCRIPCION' END
      ) AS commercial_status,
      cc.id AS commercial_client_id,
      cc.trial_ends_at,
      cc.created_at AS commercial_created_at,
      cc.category AS commercial_category,
      cc.subcategory AS commercial_subcategory,
      cc.type AS commercial_type,
      cc.phone AS commercial_phone
    FROM app_user_profiles ap
    LEFT JOIN users u ON lower(u.email)=lower(ap.email)
    LEFT JOIN doctors d ON d.user_id=u.id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    LEFT JOIN LATERAL (
      SELECT id,status,trial_ends_at,created_at,category,subcategory,type,phone
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
    GROUP BY
      ap.auth_user_id,ap.full_name,ap.email,ap.phone,
      d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.bio,d.accepts_online_booking,
      u.full_name,u.email,u.phone,u.active,
      cc.status,cc.id,cc.trial_ends_at,cc.created_at,cc.category,cc.subcategory,cc.type,cc.phone
    ORDER BY ap.full_name,ap.email` : [];

  let recoverable:any[]=[];
  if(sql){
    try{
      recoverable=await sql`
        SELECT
          au.id::text AS auth_user_id,
          au.email,
          COALESCE(NULLIF(to_jsonb(au)->>'name',''),split_part(au.email,'@',1)) AS full_name
        FROM neon_auth."user" au
        WHERE lower(au.email)<>lower(${MASTER_EMAIL})
          AND NOT EXISTS (
            SELECT 1
            FROM app_user_profiles ap
            WHERE ap.auth_user_id=au.id::text
               OR lower(ap.email)=lower(au.email)
          )
        ORDER BY au.email`;
    }catch(error){
      console.error('TUCITA recoverable professionals lookup error',error);
    }
  }

  const normalized=(rows as any[]).map(r=>({
    ...r,
    display_name:r.full_name||r.registered_name||'Sin nombre',
    display_email:r.email||r.registered_email||'—',
    display_phone:r.phone||r.registered_phone||r.commercial_phone||'—',
    display_category:r.provider_category||r.commercial_category||'—',
    display_activity:r.provider_activity||r.commercial_subcategory||'Pendiente',
    display_type:r.provider_type||r.commercial_type||'Profesional independiente',
    profile_complete:Boolean(r.public_slug),
    needs_repair:!r.public_slug||!r.provider_category||!r.provider_activity||!r.commercial_client_id||!r.trial_ends_at,
    trial_end:r.trial_ends_at?new Date(r.trial_ends_at):null,
    trial_days_remaining:r.trial_ends_at?Math.max(0,Math.ceil((new Date(r.trial_ends_at).getTime()-Date.now())/86400000)):0,
    profile_image:parseProviderMedia(r.bio).profileImage||'',
    about:parseProviderMedia(r.bio).about||'',
    credential_status:parseProviderMedia(r.bio).credentialStatus||'NONE',
    credential_number:parseProviderMedia(r.bio).licenseNumber||'',
    credential_images:parseProviderMedia(r.bio).workImages||[],
    has_credentials:Boolean(parseProviderMedia(r.bio).licenseNumber||(parseProviderMedia(r.bio).workImages||[]).length)
  }));

  const filtered=normalized.filter(r=>{
    const hay=[
      r.display_name,r.display_email,r.display_phone,
      r.display_category,r.display_activity,r.display_type
    ].filter(Boolean).join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(status==='TODOS'||String(r.commercial_status)===status);
  });

  const realCount=filtered.filter((r:any)=>String(r.commercial_status)!=='DEMO').length;
  const completeCount=filtered.filter((r:any)=>r.profile_complete).length;
  const incompleteCount=filtered.length-completeCount;

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar">
      <div>
        <div className="muted" style={{fontSize:13}}>Red TUCITA</div>
        <h1>Profesionales y negocios</h1>
      </div>
    </div>

    <section className="panel">
      <form method="get" className="row" style={{gap:10,flexWrap:'wrap',alignItems:'end'}}>
        <div className="field" style={{flex:1,minWidth:240}}>
          <label>Buscar</label>
          <div style={{position:'relative'}}>
            <Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
            <input name="q" defaultValue={String(sp.q||'')} placeholder="Nombre, correo o rubro" style={{paddingLeft:38}}/>
          </div>
        </div>
        <div className="field" style={{minWidth:210}}>
          <label>Estado</label>
          <select name="status" defaultValue={status}>
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="TRIAL">Prueba</option>
            <option value="REVISION_BINANCE">Pago en revisión</option>
            <option value="PAGO_PENDIENTE">Pago pendiente</option>
            <option value="SUSPENDIDO">Suspendido</option>
            <option value="SIN_SUSCRIPCION">Sin suscripción</option>
            <option value="DEMO">Solo demo</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">Filtrar</button>
        <Link className="btn btn-secondary" href="/master/profesionales">Limpiar</Link>
      </form>

      <div className="row" style={{gap:12,flexWrap:'wrap',marginTop:12}}>
        <span className="pill">{realCount} registrado{realCount===1?'':'s'}</span>
        <span className="pill">{completeCount} con perfil completo</span>
        {incompleteCount>0&&<span className="pill">{incompleteCount} pendiente{incompleteCount===1?'':'s'} de completar</span>}
      </div>
      <div className="muted" style={{fontSize:12,marginTop:8}}>
        Todo profesional nuevo aparece aquí desde su registro con 15 días de prueba. Solo pasa a Suscripciones cuando envía o tiene un pago.
      </div>
      <div className="row space" style={{gap:12,flexWrap:'wrap',marginTop:14}}>
        <div className="muted" style={{fontSize:12}}>Vista del directorio</div>
        <ProfessionalViewToggle currentView={view}/>
      </div>
    </section>

    {recoverable.length>0&&<section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div>
          <h2>Profesionales recuperables</h2>
          <div className="muted" style={{fontSize:13}}>
            Estas cuentas todavía existen en el acceso de TUCITA, pero perdieron su perfil profesional durante el reinicio anterior.
            Restaura únicamente los correos que reconozcas como profesionales reales.
          </div>
        </div>
        <span className="pill">{recoverable.length} cuenta{recoverable.length===1?'':'s'} recuperable{recoverable.length===1?'':'s'}</span>
      </div>
      <div style={{overflowX:'auto',marginTop:12}}>
        <table className="table">
          <thead><tr><th>Nombre</th><th>Correo / usuario</th><th>Recuperación</th></tr></thead>
          <tbody>{recoverable.map((r:any)=><tr key={r.auth_user_id}>
            <td><strong>{r.full_name||'Profesional'}</strong></td>
            <td>{r.email}<div className="muted" style={{fontSize:11}}>Conserva su contraseña actual.</div></td>
            <td><RecoverProfessionalButton authUserId={String(r.auth_user_id)} email={String(r.email)} name={String(r.full_name||'Profesional')}/></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="notice" style={{marginTop:12}}>
        Al restaurar, TUCITA le asigna 15 días completos de prueba desde hoy. El profesional deberá volver a completar teléfono, rubro, servicios, fotos, ubicación y horarios que se perdieron con el reinicio anterior.
      </div>
    </section>}

    <section className="panel" style={{marginTop:18}}>
      {filtered.length===0
        ?<div className="notice">Todavía no hay profesionales registrados con esos filtros.</div>
        :view==='cards'
          ?<div className="master-professional-card-grid">
            {filtered.map((r:any)=><article className="master-professional-card" key={String(r.auth_user_id||r.display_email)}>
              <div className="master-professional-cover">
                {r.profile_image
                  ?<img src={r.profile_image} alt={'Foto de '+r.display_name}/>
                  :<div className="master-professional-avatar"><UserRound size={34}/></div>}
                <div className="master-professional-status">
                  {String(r.commercial_status)==='TRIAL'&&r.trial_end
                    ?<span className="pill">Prueba · {r.trial_days_remaining} día{r.trial_days_remaining===1?'':'s'}</span>
                    :<span className="pill">{labels[r.commercial_status]||r.commercial_status}</span>}
                </div>
              </div>

              <div className="master-professional-body">
                <div>
                  <div className="row" style={{gap:7,flexWrap:'wrap'}}>
                    <h3 style={{margin:0,fontSize:20}}>{r.display_name}</h3>
                    {String(r.commercial_status)==='DEMO'&&<span className="pill">Demo</span>}
                  </div>
                  <div className="muted" style={{fontSize:13,marginTop:4}}>{r.display_activity}</div>
                  <div className="muted" style={{fontSize:12}}>{r.display_category} · {r.display_type}</div>
                </div>

                {r.about&&<p className="master-professional-about">{r.about}</p>}

                <div className="master-professional-meta">
                  <div><Mail size={14}/><span>{r.display_email}</span></div>
                  <div><Phone size={14}/><span>{r.display_phone}</span></div>
                  <div><BriefcaseBusiness size={14}/><span>{r.services||0} servicio{Number(r.services||0)===1?'':'s'}</span></div>
                </div>

                {r.has_credentials&&<div className="notice" style={{padding:10}}>
                  <strong>Credenciales profesionales</strong>
                  {r.credential_number&&<div style={{marginTop:4,fontSize:12}}>{r.credential_number}</div>}
                  {r.credential_images?.length>0&&<div className="row" style={{gap:6,marginTop:8,flexWrap:'wrap'}}>{r.credential_images.slice(0,4).map((img:string,i:number)=><img key={i} src={img} alt={'Credencial '+(i+1)} style={{width:58,height:44,objectFit:'cover',borderRadius:9,border:'1px solid var(--line)'}}/>)}</div>}
                </div>}

                <CredentialsReviewActions slug={String(r.public_slug||'')} status={String(r.credential_status)} hasCredentials={Boolean(r.has_credentials)}/>

                {!r.profile_complete&&<div className="notice" style={{padding:'8px 10px',fontSize:12}}>
                  <AlertTriangle size={13}/> Cuenta conservada. Faltan datos técnicos del perfil.
                </div>}

                {String(r.commercial_status)==='TRIAL'&&r.trial_end&&<div className="muted" style={{fontSize:11}}>
                  Prueba de 15 días hasta {r.trial_end.toLocaleDateString('es-VE')}
                </div>}

                <div className="master-professional-actions">
                  {r.profile_complete&&r.public_slug
                    ?<a href={'/reservar/'+r.public_slug} target="_blank" rel="noreferrer" className="btn btn-primary"><ExternalLink size={14}/> Ver perfil completo</a>
                    :<span className="btn btn-secondary" style={{opacity:.65,cursor:'default'}}>Perfil incompleto</span>}
                  {r.commercial_client_id&&<Link href={'/master/clientes/'+r.commercial_client_id} className="btn btn-secondary">Ficha comercial</Link>}
                </div>

                <div className="master-professional-admin">
                  {r.needs_repair&&<RepairProfessionalButton authUserId={String(r.auth_user_id)} email={String(r.display_email)} name={String(r.display_name)}/>}
                  {r.profile_complete&&<ProfessionalActions slug={r.public_slug} active={Boolean(r.active)} name={r.display_name}/>}
                </div>
              </div>
            </article>)}
          </div>
          :<div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th><th>Rubro</th><th>Tipo</th><th>Servicios</th><th>Credenciales</th><th>Estado</th><th>Reserva pública</th><th>Administrar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r:any)=><tr key={String(r.auth_user_id||r.display_email)}>
                  <td>
                    <div className="row" style={{gap:10,alignItems:'center'}}>
                      {r.profile_image
                        ?<img src={r.profile_image} alt="" style={{width:42,height:42,borderRadius:12,objectFit:'cover',flex:'0 0 auto'}}/>
                        :<div className="profile-avatar" style={{width:42,height:42,flex:'0 0 auto'}}><UserRound size={18}/></div>}
                      <div>
                        <strong>{r.display_name}</strong>
                        {String(r.commercial_status)==='DEMO'&&<span className="pill" style={{marginLeft:8}}>Demo</span>}
                        <div className="muted" style={{fontSize:12}}>{r.display_email} · {r.display_phone}</div>
                      </div>
                    </div>
                    {!r.profile_complete&&<div className="notice" style={{marginTop:6,padding:'6px 8px',fontSize:12}}>
                      <AlertTriangle size={13}/> Cuenta conservada. Faltan datos técnicos del perfil profesional.
                    </div>}
                  </td>
                  <td>{r.display_category}<div className="muted" style={{fontSize:12}}>{r.display_activity}</div></td>
                  <td>{r.display_type}</td>
                  <td>{r.services||0}</td>
                  <td style={{minWidth:220}}>
                    <CredentialsReviewActions slug={String(r.public_slug||'')} status={String(r.credential_status)} hasCredentials={Boolean(r.has_credentials)}/>
                  </td>
                  <td>
                    {String(r.commercial_status)==='TRIAL'&&r.trial_end?<>
                      <span className="pill">Prueba gratis · {r.trial_days_remaining} día{r.trial_days_remaining===1?'':'s'} restante{r.trial_days_remaining===1?'':'s'}</span>
                      <div className="muted" style={{fontSize:11,marginTop:5}}>15 días de prueba · hasta {r.trial_end.toLocaleDateString('es-VE')}</div>
                    </>:<span className="pill">{labels[r.commercial_status]||r.commercial_status}</span>}
                    {r.commercial_client_id&&<div style={{marginTop:6}}>
                      <Link href={'/master/clientes/'+r.commercial_client_id} className="muted" style={{fontSize:12}}>Abrir ficha comercial</Link>
                    </div>}
                  </td>
                  <td>
                    {r.profile_complete&&r.accepts_online_booking&&r.active
                      ?<a className="btn btn-secondary" href={'/reservar/'+r.public_slug} target="_blank" rel="noreferrer">Ver perfil</a>
                      :<span className="muted">{r.profile_complete?'Pausada':'Aún no creada'}</span>}
                  </td>
                  <td>
                    <div style={{display:'grid',gap:8}}>
                      {r.needs_repair&&<RepairProfessionalButton authUserId={String(r.auth_user_id)} email={String(r.display_email)} name={String(r.display_name)}/>}
                      {r.profile_complete
                        ?<ProfessionalActions slug={r.public_slug} active={Boolean(r.active)} name={r.display_name}/>
                        :!r.needs_repair?<span className="muted">Completar registro</span>:null}
                    </div>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>}
    </section>
  </main></div>;
}
