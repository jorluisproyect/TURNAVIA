import Link from 'next/link';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { parseProviderMedia } from '@/lib/provider-media';
import {
  Search, MapPin, HeartPulse, Sparkles, Scissors, Leaf,
  Plane, Palette, Scale, MoreHorizontal, Home, CalendarDays,
  UserRound, BriefcaseBusiness, ArrowRight
} from 'lucide-react';

export const dynamic='force-dynamic';

const categories=[
  {label:'Salud',icon:HeartPulse,href:'/explorar?category=Salud'},
  {label:'Belleza',icon:Sparkles,href:'/explorar?category=Belleza'},
  {label:'Barbería',icon:Scissors,href:'/explorar?category=Barbería'},
  {label:'Spa',icon:Leaf,href:'/explorar?category=Spa'},
  {label:'Viajes',icon:Plane,href:'/explorar?category=Viajes'},
  {label:'Tatuajes',icon:Palette,href:'/explorar?category=Tatuajes'},
  {label:'Abogados',icon:Scale,href:'/explorar?category=Abogados'},
  {label:'Otros',icon:MoreHorizontal,href:'/explorar'}
];

export default async function AndroidAppHome(){
  const {data:session}=await auth.getSession();
  let role='';
  let name='';
  let profileHref='/ingresar';

  if(session?.user){
    name=String((session.user as any)?.name||(session.user as any)?.email||'');
    if(sql){
      const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
      role=String((rows[0] as any)?.role||'PATIENT');
    }
    profileHref=role==='DOCTOR'?'/medico':role==='MASTER'?'/master':role==='CLINIC_ADMIN'||role==='RECEPTION'?'/recepcion':'/paciente/perfil';
  }

  const rows=sql?await sql`
    SELECT d.public_slug,d.provider_category,d.provider_activity,d.bio,u.full_name,
      l.city,l.state,l.country
    FROM doctors d
    JOIN users u ON u.id=d.user_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
    WHERE u.active=true AND d.accepts_online_booking=true
    ORDER BY d.created_at DESC
    LIMIT 8
  `:[];

  const providers:any[]=[];
  const seen=new Set<string>();
  for(const row of rows as any[]){
    const slug=String(row.public_slug||'');
    if(!slug||seen.has(slug))continue;
    seen.add(slug);
    providers.push(row);
    if(providers.length>=4)break;
  }

  const homeHref='/app?android=1';
  const bookingHref=role==='DOCTOR'?'/medico/agenda':role==='MASTER'?'/master':role==='CLINIC_ADMIN'||role==='RECEPTION'?'/recepcion/agenda':'/paciente';
  const bookingLabel=role==='DOCTOR'||role==='CLINIC_ADMIN'||role==='RECEPTION'?'Agenda':'Reservas';
  const profileNavHref=session?.user?profileHref:'/ingresar';

  return <main className="android-app-home">
    <header className="android-app-header">
      <div className="android-app-brand">
        <img src="/icons/tucita-brand.svg" alt="TUCITA"/>
        <strong>TUCITA</strong>
      </div>
      <Link href={profileHref} className="android-app-avatar" aria-label={session?.user?'Abrir mi cuenta':'Iniciar sesión'}>
        <UserRound size={20}/>
      </Link>
    </header>

    <section className="android-location">
      <MapPin size={15}/>
      <span>Encuentra servicios cerca de ti</span>
    </section>

    <form action="/explorar" className="android-search">
      <Search size={19}/>
      <input name="q" placeholder="Buscar servicio, profesional o zona..."/>
    </form>

    <section className="android-category-grid" aria-label="Categorías">
      {categories.map(({label,icon:Icon,href},i)=>
        <Link key={label} href={href} className={'android-category android-category-'+(i+1)}>
          <span><Icon size={23}/></span>
          <small>{label}</small>
        </Link>
      )}
    </section>

    <section className="android-app-section">
      <div className="android-section-title">
        <div>
          <h1>{session?.user?'Hola'+(name?', '+name.split(' ')[0]:''):'Profesionales disponibles'}</h1>
          <p>Reserva fácil, rápido y desde tu teléfono.</p>
        </div>
        <Link href="/explorar">Ver todos</Link>
      </div>

      {providers.length?
        <div className="android-provider-scroll">
          {providers.map((p:any)=>{
            const media=parseProviderMedia(p.bio);
            return <Link href={'/reservar/'+p.public_slug} className="android-provider-card" key={p.public_slug}>
              <div className="android-provider-photo">
                {media.profileImage?<img src={media.profileImage} alt=""/>:<UserRound size={30}/>}
              </div>
              <div className="android-provider-copy">
                <strong>{p.full_name}</strong>
                <span>{p.provider_activity||p.provider_category||'Servicio profesional'}</span>
                <small><MapPin size={12}/>{[p.city,p.state,p.country].filter(Boolean).join(' · ')||'Ubicación disponible'}</small>
              </div>
              <ArrowRight size={17}/>
            </Link>
          })}
        </div>
        :
        <div className="android-empty-card">
          <BriefcaseBusiness size={28}/>
          <strong>Explora TUCITA</strong>
          <span>Busca profesionales, negocios y servicios disponibles.</span>
          <Link href="/explorar" className="btn btn-primary">Explorar servicios</Link>
        </div>
      }
    </section>

    {!session?.user&&<section className="android-welcome-card">
      <div>
        <strong>Bienvenido a TUCITA</strong>
        <span>Agenda · Paga · Confirma</span>
      </div>
      <div className="android-welcome-actions">
        <Link href="/ingresar" className="btn btn-primary">Iniciar sesión</Link>
        <Link href="/registro" className="btn btn-secondary">Crear cuenta</Link>
      </div>
    </section>}

    <nav className="android-native-nav" aria-label="Navegación de TUCITA">
      <Link href={homeHref} className="active"><Home size={21}/><span>Inicio</span></Link>
      <Link href="/explorar"><Search size={21}/><span>Buscar</span></Link>
      <Link href={session?.user?bookingHref:'/ingresar'}><CalendarDays size={21}/><span>{bookingLabel}</span></Link>
      <Link href={profileNavHref}><UserRound size={21}/><span>Perfil</span></Link>
    </nav>
  </main>;
}
