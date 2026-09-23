import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { CalendarDays, UserRound } from 'lucide-react';
import { parseProviderMedia } from '@/lib/provider-media';

export const dynamic='force-dynamic';

export default async function MisProfesionales(){
 const {data:session}=await auth.getSession();
 let rows:any[]=[];
 if(sql&&session?.user){
   const email=String((session.user as any).email||'').toLowerCase();
   rows=await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.bio,u.full_name,
      count(a.id)::int AS appointment_count,max(a.starts_at) AS last_appointment
     FROM appointments a
     JOIN patients p ON p.id=a.patient_id
     JOIN doctors d ON d.id=a.doctor_id
     JOIN users u ON u.id=d.user_id
     WHERE lower(p.email)=lower(${email})
     GROUP BY d.id,u.full_name
     ORDER BY max(a.starts_at) DESC`;
 }
 return <div className="dashboard"><Sidebar role="paciente"/><main className="main">
   <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Mis contactos</div><h1>Mis profesionales</h1></div><Link href="/explorar" className="btn btn-primary">Explorar</Link></div>
   <section className="panel">{rows.length===0?<div className="empty">Cuando reserves con un profesional o negocio, aparecerá aquí. <Link href="/explorar">Explorar TUCITA</Link>.</div>:<div className="role-grid">{rows.map((r:any)=>{const media=parseProviderMedia(r.bio);return <Link className="role-card" key={r.public_slug} href={'/reservar/'+r.public_slug}>{media.profileImage?<img src={media.profileImage} alt="" style={{width:72,height:72,borderRadius:22,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:72,height:72}}><UserRound size={27}/></div>}<h3>{r.full_name}</h3><p>{r.provider_activity} · {r.provider_category}</p><div className="muted" style={{fontSize:12}}><CalendarDays size={13} style={{verticalAlign:'-2px',marginRight:5}}/>{Number(r.appointment_count||0)} cita{Number(r.appointment_count||0)===1?'':'s'} contigo</div><div className="go">Reservar nuevamente</div></Link>})}</div>}</section>
 </main></div>;
}
