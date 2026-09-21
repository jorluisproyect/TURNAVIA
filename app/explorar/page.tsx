import Link from 'next/link';
import { sql } from '@/lib/db';
import { Brand } from '@/components/Brand';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { PROVIDER_CATEGORIES } from '@/lib/provider-catalog';

export const dynamic='force-dynamic';

export default async function Explorar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const selectedCategory=String(sp.category||'').trim();

  const rows=sql?await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,u.full_name,
      l.city,l.state,l.country,COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services
    FROM doctors d JOIN users u ON u.id=d.user_id
    LEFT JOIN organizations o ON o.id=u.organization_id
    LEFT JOIN commercial_clients c ON lower(c.email)=lower(COALESCE(o.email,u.email))
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    WHERE u.active=true AND d.accepts_online_booking=true
      AND (
        c.id IS NULL
        OR (c.status IN ('TRIAL','REVISION_BINANCE') AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at>now())
        OR (c.status='ACTIVO' AND COALESCE(c.payment_reviewed_at,c.created_at)>=now()-interval '31 days')
      )
    GROUP BY d.id,u.full_name,l.city,l.state,l.country
    ORDER BY d.provider_category,u.full_name`:[];

  const visible=selectedCategory
    ? (rows as any[]).filter(r=>String(r.provider_category||'')===selectedCategory)
    : rows as any[];

  return <main className="demo-chooser"><div className="container" style={{paddingTop:28,paddingBottom:50}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link href="/ingresar" className="btn btn-secondary">Ingresar</Link></div>

    <div className="demo-head">
      <span className="eyebrow"><Search size={15}/> Explorar TURNAVIA</span>
      <h1>Encuentra el servicio que necesitas y reserva tu hora.</h1>
      <p className="muted">TURNAVIA funciona para profesionales y negocios de múltiples rubros. Explora las categorías y luego elige quién te atenderá.</p>
    </div>

    <section className="panel">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div><h2>Rubros disponibles en TURNAVIA</h2><p className="muted" style={{marginTop:-6}}>Estas son las actividades que la plataforma puede organizar con servicios, precios, horarios y reservas.</p></div>
        {selectedCategory&&<Link href="/explorar" className="btn btn-secondary">Ver todos los rubros</Link>}
      </div>

      <div className="grid-3" style={{marginTop:16}}>
        {Object.entries(PROVIDER_CATEGORIES).map(([category,activities])=>{
          const active=selectedCategory===category;
          return <Link key={category} href={'/explorar?category='+encodeURIComponent(category)} className="card" style={{textDecoration:'none',borderColor:active?'var(--brand)':'var(--line)',boxShadow:active?'0 0 0 2px rgba(15,118,110,.12)':'none'}}>
            <div className="row space"><span className="eyebrow">{category}</span>{active&&<span className="status ok">Seleccionado</span>}</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>{activities.map(activity=><span key={activity} className="pill">{activity}</span>)}</div>
            <div className="go" style={{marginTop:14}}>Ver profesionales <ArrowRight size={16}/></div>
          </Link>
        })}
      </div>
    </section>

    <section style={{marginTop:22}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div><h2 style={{marginBottom:4}}>{selectedCategory?'Profesionales en '+selectedCategory:'Profesionales disponibles'}</h2><p className="muted" style={{margin:0}}>Solo se muestran agendas que actualmente pueden recibir reservas.</p></div>
        {selectedCategory&&<span className="pill">{visible.length} resultado{visible.length===1?'':'s'}</span>}
      </div>

      {visible.length===0?<section className="profile-card" style={{marginTop:14}}><div className="empty">{selectedCategory?<>Todavía no hay profesionales públicos disponibles en <strong>{selectedCategory}</strong>. Puedes explorar otro rubro o ver el <Link href="/demo">demo multirrubro</Link>.</>:<>Todavía no hay profesionales públicos disponibles. Puedes ver el <Link href="/demo">demo multirrubro</Link>.</>}</div></section>:
      <div className="role-grid" style={{marginTop:14}}>{visible.map((r:any)=><Link key={r.public_slug} className="role-card" href={'/reservar/'+r.public_slug}>
        <div className="iconbox"><Sparkles/></div>
        <span className="eyebrow">{r.provider_category||'Servicio'}</span>
        <h3>{r.full_name}</h3>
        <p>{r.provider_activity||'Servicio'} · {r.provider_type||'Profesional independiente'}</p>
        <div className="muted" style={{fontSize:12}}>{[r.city,r.state,r.country].filter(Boolean).join(' · ')||'Ubicación por configurar'}</div>
        <div className="muted" style={{fontSize:12,marginTop:5}}>{r.services} servicio{Number(r.services)===1?'':'s'} activo{Number(r.services)===1?'':'s'}</div>
        <div className="go">Ver agenda <ArrowRight size={16}/></div>
      </Link>)}</div>}
    </section>
  </div></main>;
}
