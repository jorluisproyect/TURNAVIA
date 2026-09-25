import Link from 'next/link';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth/server';
import { Brand } from '@/components/Brand';
import { Sidebar } from '@/components/Sidebar';
import { ArrowRight, MapPin, Search, UserRound } from 'lucide-react';
import { parseProviderMedia } from '@/lib/provider-media';
import { COUNTRY_PHONE_CODES, PROVIDER_CATEGORIES } from '@/lib/provider-catalog';
import { countryFromPhone } from '@/lib/country';
import { ExploreFilters } from '@/components/ExploreFilters';

export const dynamic='force-dynamic';

function text(value:any){return String(value||'').trim()}
function norm(value:any){return text(value).toLocaleLowerCase('es')}

export default async function Explorar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const selectedCategory=text(sp.category);
  const q=text(sp.q);
  const city=text(sp.city);
  const requestedCountry=text(sp.country);

  let accountCountry='';
  let sessionRole='';
  let loggedIn=false;

  try{
    const {data:session}=await auth.getSession();
    loggedIn=Boolean(session?.user);
    if(sql&&session?.user){
      const email=String((session.user as any).email||'').toLowerCase();
      const profile=await sql`SELECT role,COALESCE(NULLIF(phone,''),'') AS phone
        FROM app_user_profiles
        WHERE auth_user_id=${String(session.user.id)} OR lower(email)=lower(${email})
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1`;
      sessionRole=String((profile[0] as any)?.role||'');
      const saved=await sql`SELECT metadata->>'country' AS country
        FROM audit_events
        WHERE action='ACCOUNT_REGISTERED'
          AND entity_type='ACCOUNT_PROFILE'
          AND entity_id=${String(session.user.id)}
        ORDER BY created_at DESC
        LIMIT 1`;
      accountCountry=String((saved[0] as any)?.country||'').trim()
        ||countryFromPhone(String((profile[0] as any)?.phone||''));
    }
  }catch{}

  const patientLoggedIn=loggedIn&&sessionRole==='PATIENT';
  const allCountries=requestedCountry==='ALL';
  const selectedCountry=allCountries?'':(requestedCountry||accountCountry);

  const rows=sql?await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.bio,u.full_name,
      l.city,l.state,l.country,COUNT(ps.id) FILTER (WHERE ps.active=true)::int AS services,
      string_agg(DISTINCT ps.name,' · ') FILTER (WHERE ps.active=true) AS service_names
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
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
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

  const raw=rows as any[];
  const filteredRaw=raw.filter(r=>{
    if(selectedCategory&&text(r.provider_category)!==selectedCategory)return false;
    if(selectedCountry&&norm(r.country)!==norm(selectedCountry))return false;
    if(city&&!norm([r.city,r.state].filter(Boolean).join(' ')).includes(norm(city)))return false;
    if(q){
      const hay=norm([r.full_name,r.provider_category,r.provider_activity,r.provider_type,r.service_names,r.city,r.state,r.country].filter(Boolean).join(' '));
      if(!hay.includes(norm(q)))return false;
    }
    return true;
  });

  const bySlug=new Map<string,any>();
  for(const row of filteredRaw){
    const slug=String(row.public_slug);
    const existing=bySlug.get(slug);
    if(!existing)bySlug.set(slug,{...row,locations:[[row.city,row.state,row.country].filter(Boolean).join(' · ')]});
    else{
      const loc=[row.city,row.state,row.country].filter(Boolean).join(' · ');
      if(loc&&!existing.locations.includes(loc))existing.locations.push(loc);
    }
  }
  const visible=[...bySlug.values()];
  const activeCategories=Array.from(new Set(raw.map(r=>String(r.provider_category||'')).filter(Boolean)));
  const allCount=new Set(raw.map(r=>String(r.public_slug))).size;
  const countries=COUNTRY_PHONE_CODES.map(x=>({country:x.country,flag:x.flag}));
  const locationsByCountry:Record<string,{value:string;label:string}[]>={};
  for(const row of raw){
    const countryName=text(row.country);
    if(!countryName)continue;
    const cityName=text(row.city);
    const stateName=text(row.state);
    const value=cityName||stateName;
    if(!value)continue;
    const label=cityName&&stateName&&norm(cityName)!==norm(stateName)?cityName+' · '+stateName:value;
    locationsByCountry[countryName]??=[];
    if(!locationsByCountry[countryName].some(x=>norm(x.label)===norm(label))){
      locationsByCountry[countryName].push({value,label});
    }
  }
  for(const list of Object.values(locationsByCountry)){
    list.sort((a,b)=>a.label.localeCompare(b.label,'es'));
  }

  const params=(overrides:Record<string,string>)=>{
    const next=new URLSearchParams();
    const current={q,city,category:selectedCategory,country:requestedCountry||(!allCountries&&selectedCountry?selectedCountry:'')};
    for(const [key,value] of Object.entries({...current,...overrides})){
      if(value)next.set(key,value);
    }
    const qs=next.toString();
    return '/explorar'+(qs?'?'+qs:'');
  };

  const content=<main className={patientLoggedIn?'main':'demo-chooser'}><div className={patientLoggedIn?'explore-clean':'container explore-clean'}>
    {!patientLoggedIn&&<div className="row space explore-top">
      <Brand/>
      {loggedIn?<Link href="/panel" className="btn btn-secondary">Mi panel</Link>:<Link href="/ingresar" className="btn btn-secondary">Ingresar</Link>}
    </div>}

    <div className="explore-clean-head">
      <span className="eyebrow"><Search size={15}/> Explorar TUCITA</span>
      <h1>Encuentra el servicio que necesitas.</h1>
      <p className="muted">Te mostramos primero tu país, pero puedes cambiarlo para reservar en cualquier país disponible en TUCITA.</p>
    </div>

    <section className="panel" style={{marginBottom:18}}>
      <ExploreFilters
        q={q}
        selectedCountry={allCountries?'ALL':selectedCountry}
        selectedCity={city}
        selectedCategory={selectedCategory}
        countries={countries}
        locationsByCountry={locationsByCountry}
        categories={Object.keys(PROVIDER_CATEGORIES)}
      />
      {accountCountry&&!requestedCountry&&<div className="notice" style={{marginTop:12}}><MapPin size={15}/> País inicial de tu cuenta: <strong>{countries.find(x=>x.country===accountCountry)?.flag||'📍'} {accountCountry}</strong>. Puedes cambiarlo cuando quieras.</div>}
    </section>

    {raw.length===0?
      <section className="explore-empty">
        <div className="explore-empty-icon"><UserRound size={30}/></div>
        <h2>Aún no hay profesionales publicados</h2>
        <p>Cuando comiencen a registrarse y activen su agenda, aparecerán aquí para reservar.</p>
      </section>
      :
      <section>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div>
            <h2 style={{margin:'0 0 4px'}}>{selectedCountry?'Profesionales en '+(countries.find(x=>x.country===selectedCountry)?.flag||'')+' '+selectedCountry:'Profesionales disponibles'}</h2>
            <p className="muted" style={{margin:0}}>{visible.length} resultado{visible.length===1?'':'s'} · {allCount} profesional{allCount===1?'':'es'} disponible{allCount===1?'':'s'} en TUCITA.</p>
          </div>
        </div>

        {activeCategories.length>1&&<div className="explore-filters" aria-label="Filtrar por categoría">
          <Link href={params({category:''})} className={!selectedCategory?'active':''}>Todos</Link>
          {activeCategories.map(category=><Link key={category} href={params({category})} className={selectedCategory===category?'active':''}>{category}</Link>)}
        </div>}

        {visible.length===0?
          <div className="explore-empty compact">
            <h3>No encontramos profesionales con esos filtros.</h3>
            <p>Prueba otra ciudad, país, rubro o búsqueda.</p>
            <Link href="/explorar?country=ALL" className="btn btn-secondary">Buscar en todos los países</Link>
          </div>
          :
          <div className="explore-provider-grid">{visible.map((r:any)=>{const media=parseProviderMedia(r.bio);return <Link key={r.public_slug} className="explore-provider-card" href={'/reservar/'+r.public_slug}>
            <div className="explore-provider-main">
              {media.profileImage?<img src={media.profileImage} alt="" className="explore-provider-photo"/>:<div className="profile-avatar explore-provider-photo"><UserRound size={27}/></div>}
              <div className="explore-provider-copy">
                <span className="eyebrow">{r.provider_category||'Servicio'}</span>
                <h3>{r.full_name}</h3>
                <p>{r.provider_activity||'Servicio'}{r.provider_type?' · '+r.provider_type:''}</p>
                {r.service_names&&<small style={{display:'block',marginBottom:4}}>Servicios: {String(r.service_names).split(' · ').slice(0,3).join(' · ')}</small>}
                <small><MapPin size={12} style={{verticalAlign:'middle'}}/> {(r.locations||[]).filter(Boolean).join(' / ')||'Ubicación por configurar'}</small>
              </div>
            </div>
            <div className="explore-provider-action">Ver servicios y agenda <ArrowRight size={16}/></div>
          </Link>})}</div>}
      </section>
    }
  </div></main>;

  return patientLoggedIn?<div className="dashboard"><Sidebar role="paciente"/>{content}</div>:content;
}
