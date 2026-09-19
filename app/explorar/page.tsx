import Link from 'next/link';
import { sql } from '@/lib/db';
import { Brand } from '@/components/Brand';
import { ArrowRight, Search, Sparkles } from 'lucide-react';

export const dynamic='force-dynamic';

export default async function Explorar(){
  const rows=sql?await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,u.full_name,
      l.city,l.state,COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services
    FROM doctors d JOIN users u ON u.id=d.user_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    WHERE u.active=true AND d.accepts_online_booking=true
    GROUP BY d.id,u.full_name,l.city,l.state
    ORDER BY d.provider_category,u.full_name`:[];

  return <main className="demo-chooser"><div className="container" style={{paddingTop:28,paddingBottom:50}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link href="/ingresar" className="btn btn-secondary">Ingresar</Link></div>
    <div className="demo-head"><span className="eyebrow"><Search size={15}/> Explorar TURNAVIA</span><h1>Encuentra un servicio y reserva tu hora.</h1><p className="muted">Salud, belleza, bienestar, servicios profesionales, automotriz, mascotas y más.</p></div>
    {rows.length===0?<section className="profile-card"><div className="empty">Todavía no hay profesionales públicos disponibles. Puedes ver el <Link href="/demo">demo multirrubro</Link>.</div></section>:
    <div className="role-grid">{rows.map((r:any)=><Link key={r.public_slug} className="role-card" href={'/reservar/'+r.public_slug}>
      <div className="iconbox"><Sparkles/></div>
      <span className="eyebrow">{r.provider_category||'Servicio'}</span>
      <h3>{r.full_name}</h3>
      <p>{r.provider_activity||'Servicio'} · {r.provider_type||'Profesional independiente'}{r.city?' · '+r.city:''}</p>
      <div className="go">Ver agenda <ArrowRight size={16}/></div>
    </Link>)}</div>}
  </div></main>;
}
