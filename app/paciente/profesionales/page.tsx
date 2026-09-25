import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { CalendarDays, UserRound, Search, MapPin } from 'lucide-react';
import { parseProviderMedia } from '@/lib/provider-media';
import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';
import { countryFromPhone } from '@/lib/country';

export const dynamic='force-dynamic';

export default async function MisProfesionales(){
 const {data:session}=await auth.getSession();
 let rows:any[]=[];
 let accountCountry='';
 if(sql&&session?.user){
   const email=String((session.user as any).email||'').toLowerCase();
   const countryRows=await sql`SELECT
      COALESCE((
        SELECT ae.metadata->>'country'
        FROM audit_events ae
        WHERE ae.action='ACCOUNT_REGISTERED'
          AND ae.entity_type='ACCOUNT_PROFILE'
          AND ae.entity_id=${String(session.user.id)}
        ORDER BY ae.created_at DESC LIMIT 1
      ),'') AS country,
      COALESCE(NULLIF(ap.phone,''),NULLIF(p.phone,''),'') AS phone
    FROM app_user_profiles ap
    LEFT JOIN patients p ON lower(p.email)=lower(ap.email)
    WHERE ap.auth_user_id=${String(session.user.id)} OR lower(ap.email)=lower(${email})
    ORDER BY ap.updated_at DESC NULLS LAST
    LIMIT 1`;
   accountCountry=String((countryRows[0] as any)?.country||'').trim()||countryFromPhone(String((countryRows[0] as any)?.phone||''));
   rows=await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.bio,u.full_name,
      count(a.id)::int AS appointment_count,max(a.starts_at) AS last_appointment
     FROM appointments a
     JOIN patients p ON p.id=a.patient_id
     JOIN doctors d ON d.id=a.doctor_id
     JOIN users u ON u.id=d.user_id
     JOIN app_user_profiles ap ON lower(ap.email)=lower(u.email) AND ap.role::text='DOCTOR'
     JOIN neon_auth."user" au ON lower(au.email)=lower(u.email)
     LEFT JOIN organizations o ON o.id=u.organization_id
     JOIN LATERAL (
       SELECT cc.*
       FROM commercial_clients cc
       WHERE lower(cc.email)=lower(COALESCE(o.email,u.email))
       ORDER BY cc.created_at DESC
       LIMIT 1
     ) c ON true
     WHERE lower(p.email)=lower(${email})
       AND u.active=true
       AND d.accepts_online_booking=true
       AND (
         (c.status IN ('TRIAL','REVISION_BINANCE') AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at>now())
         OR (
           c.status='ACTIVO'
           AND COALESCE(
             (
               SELECT NULLIF(ae.metadata->>'paidUntil','')::timestamptz
               FROM audit_events ae
               WHERE ae.entity_type='COMMERCIAL_CLIENT'
                 AND ae.entity_id=c.id::text
                 AND ae.action='PAYMENT_APPROVED'
               ORDER BY ae.created_at DESC
               LIMIT 1
             ),
             c.payment_reviewed_at + interval '31 days',
             c.created_at + interval '31 days'
           )>now()
         )
       )
     GROUP BY d.id,u.full_name
     ORDER BY max(a.starts_at) DESC`;
 }
 return <div className="dashboard"><Sidebar role="paciente"/><main className="main">
   <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Mis contactos</div><h1>Mis profesionales</h1></div><Link href="/explorar" className="btn btn-primary"><Search size={16}/> Explorar</Link></div>
   <section className="panel" style={{marginBottom:18}}>
     <div className="row" style={{gap:10,alignItems:'end',flexWrap:'wrap'}}>
       <div className="field" style={{minWidth:210,flex:'0 1 250px',margin:0}}>
         <label><MapPin size={14} style={{verticalAlign:'-2px'}}/> País</label>
         <form action="/explorar" method="get" className="row" style={{gap:8,alignItems:'end',flexWrap:'wrap'}}>
           <select name="country" defaultValue={accountCountry||'ALL'} style={{minWidth:210}}>
             <option value="ALL">🌎 Todos los países</option>
             {COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.country}>{x.flag} {x.country}</option>)}
           </select>
           <div style={{position:'relative',flex:1,minWidth:220}}>
             <Search size={17} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
             <input name="q" placeholder="Buscar profesional o servicio…" style={{paddingLeft:39,width:'100%'}}/>
           </div>
           <button className="btn btn-primary" type="submit"><Search size={16}/> Buscar</button>
         </form>
       </div>
     </div>
   </section>
   <section className="panel">{rows.length===0?<div className="empty">Cuando reserves con un profesional o negocio, aparecerá aquí. <Link href="/explorar">Explorar TUCITA</Link>.</div>:<div className="role-grid">{rows.map((r:any)=>{const media=parseProviderMedia(r.bio);return <Link className="role-card" key={r.public_slug} href={'/reservar/'+r.public_slug}>{media.profileImage?<img src={media.profileImage} alt="" style={{width:72,height:72,borderRadius:22,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:72,height:72}}><UserRound size={27}/></div>}<h3>{r.full_name}</h3><p>{r.provider_activity} · {r.provider_category}</p><div className="muted" style={{fontSize:12}}><CalendarDays size={13} style={{verticalAlign:'-2px',marginRight:5}}/>{Number(r.appointment_count||0)} cita{Number(r.appointment_count||0)===1?'':'s'} contigo</div><div className="go">Reservar nuevamente</div></Link>})}</div>}</section>
 </main></div>;
}
