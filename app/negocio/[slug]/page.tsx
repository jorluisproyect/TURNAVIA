import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { Brand } from '@/components/Brand';
import { CalendarDays, MapPin, UserRound } from 'lucide-react';

export const dynamic='force-dynamic';

export default async function NegocioPublico({params}:{params:Promise<{slug:string}>}){
  if(!sql) notFound();
  const {slug}=await params;
  const orgRows=await sql`SELECT id,name,slug,type FROM organizations WHERE slug=${slug} LIMIT 1`;
  const org=orgRows[0] as any;
  if(!org) notFound();

  const members=await sql`SELECT d.id,d.public_slug,d.provider_category,d.provider_activity,u.full_name,
      l.name AS location_name,l.address,l.city
    FROM users u
    JOIN doctors d ON d.user_id=u.id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    WHERE u.organization_id=${org.id} AND u.role='DOCTOR' AND u.active=true AND d.accepts_online_booking=true
    ORDER BY u.created_at`;

  const cards=[];
  for(const m of members as any[]){
    const services=await sql`SELECT name,duration_minutes,price,currency FROM provider_services WHERE doctor_id=${m.id} AND active=true ORDER BY created_at LIMIT 6`;
    cards.push({...m,services});
  }

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/explorar" className="btn btn-secondary">Explorar otros servicios</Link></div>
    <div className="demo-head"><span className="eyebrow">RESERVA CON EL EQUIPO</span><h1>{org.name}</h1><p className="muted">Elige el profesional que prefieras. Cada agenda muestra sus propios servicios, precios y horarios disponibles.</p></div>
    {cards.length===0?<section className="profile-card"><div className="notice">Este negocio todavía no tiene profesionales disponibles para reserva en línea.</div></section>:
    <div className="grid-3">{cards.map((m:any)=><section className="card" key={String(m.id)}>
      <div className="iconbox"><UserRound/></div><h2 style={{fontSize:21}}>{m.full_name}</h2><p className="muted">{m.provider_activity} · {m.provider_category}</p>
      <div className="row muted" style={{fontSize:12,marginBottom:12}}><MapPin size={14}/>{[m.location_name,m.address,m.city].filter(Boolean).join(' · ')||'Ubicación por confirmar'}</div>
      <div style={{display:'grid',gap:7}}>{(m.services as any[]).slice(0,4).map((s:any)=><div className="notice row space" key={s.name}><span>{s.name}<br/><small className="muted">{Number(s.duration_minutes)} min</small></span><strong>{s.currency} {Number(s.price)}</strong></div>)}</div>
      <Link href={'/reservar/'+m.public_slug} className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:14}}><CalendarDays size={16}/> Ver horarios y reservar</Link>
    </section>)}</div>}
  </div></main>;
}
