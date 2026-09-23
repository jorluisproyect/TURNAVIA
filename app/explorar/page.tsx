import Link from 'next/link';
import { sql } from '@/lib/db';
import { Brand } from '@/components/Brand';
import { ArrowRight, Search, UserRound } from 'lucide-react';
import { parseProviderMedia } from '@/lib/provider-media';
import { PROVIDER_CATEGORIES } from '@/lib/provider-catalog';

export const dynamic='force-dynamic';

export default async function Explorar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const selectedCategory=String(sp.category||'').trim();

  const rows=sql?await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.bio,u.full_name,
      l.city,l.state,l.country,COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services
    FROM doctors d
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
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    WHERE u.active=true AND d.accepts_online_booking=true
      AND (
        (c.status IN ('TRIAL','REVISION_BINANCE') AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at>now())
        OR (
          c.status='ACTIVO'
          AND COALESCE(
            (
              SELECT NULLIF(a.metadata->>'paidUntil','')::timestamptz
              FROM audit_events a
              WHERE a.entity_type='COMMERCIAL_CLIENT'
                AND a.entity_id=c.id::text
                AND a.action='PAYMENT_APPROVED'
              ORDER BY a.created_at DESC
              LIMIT 1
            ),
            c.payment_reviewed_at + interval '31 days',
            c.created_at + interval '31 days'
          )>now()
        )
      )
    GROUP BY d.id,u.full_name,l.city,l.state,l.country
    ORDER BY u.full_name`:[];

  const all=rows as any[];
  const visible=selectedCategory?all.filter(r=>String(r.provider_category||'')===selectedCategory):all;
  const activeCategories=Array.from(new Set(all.map(r=>String(r.provider_category||'')).filter(Boolean)));

  return <main className="demo-chooser"><div className="container explore-clean">
    <div className="row space explore-top"><Brand/><Link href="/ingresar" className="btn btn-secondary">Ingresar</Link></div>

    <div className="explore-clean-head">
      <span className="eyebrow"><Search size={15}/> Explorar servicios</span>
      <h1>Encuentra y reserva.</h1>
      <p className="muted">Los profesionales y negocios disponibles aparecerán aquí automáticamente.</p>
    </div>

    {all.length===0?
      <section className="explore-empty">
        <div className="explore-empty-icon"><UserRound size={30}/></div>
        <h2>Aún no hay profesionales publicados</h2>
        <p>Cuando comiencen a registrarse y activen su agenda, aparecerán aquí para que puedas reservar.</p>
      </section>
      :
      <>
        <section>
          <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
            <div>
              <h2 style={{margin:'0 0 4px'}}>Profesionales disponibles</h2>
              <p className="muted" style={{margin:0}}>Elige quién te atenderá y consulta su agenda.</p>
            </div>
            {selectedCategory&&<Link href="/explorar" className="btn btn-secondary">Ver todos</Link>}
          </div>

          {activeCategories.length>1&&<div className="explore-filters" aria-label="Filtrar por categoría">
            <Link href="/explorar" className={!selectedCategory?'active':''}>Todos</Link>
            {activeCategories.map(category=><Link key={category} href={'/explorar?category='+encodeURIComponent(category)} className={selectedCategory===category?'active':''}>{category}</Link>)}
          </div>}

          {visible.length===0?
            <div className="explore-empty compact"><h3>No hay profesionales en esta categoría todavía.</h3><Link href="/explorar" className="btn btn-secondary">Ver todos</Link></div>
            :
            <div className="explore-provider-grid">{visible.map((r:any)=>{const media=parseProviderMedia(r.bio);return <Link key={r.public_slug} className="explore-provider-card" href={'/reservar/'+r.public_slug}>
              <div className="explore-provider-main">
                {media.profileImage?<img src={media.profileImage} alt="" className="explore-provider-photo"/>:<div className="profile-avatar explore-provider-photo"><UserRound size={27}/></div>}
                <div className="explore-provider-copy">
                  <span className="eyebrow">{r.provider_category||'Servicio'}</span>
                  <h3>{r.full_name}</h3>
                  <p>{r.provider_activity||'Servicio'}{r.provider_type?' · '+r.provider_type:''}</p>
                  <small>{[r.city,r.state,r.country].filter(Boolean).join(' · ')||'Ubicación por configurar'}</small>
                </div>
              </div>
              <div className="explore-provider-action">Ver agenda <ArrowRight size={16}/></div>
            </Link>})}</div>}
        </section>
      </>
    }
  </div></main>;
}
