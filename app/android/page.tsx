import Link from 'next/link';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { parseProviderMedia } from '@/lib/provider-media';
import { Search, MapPin, HeartPulse, Sparkles, Scissors, Leaf, Plane, Palette, Scale, MoreHorizontal, Home, CalendarDays, UserRound, ArrowRight } from 'lucide-react';
import styles from './android.module.css';

export const dynamic='force-dynamic';

const cats=[
  ['Salud',HeartPulse,'Salud'],['Belleza',Sparkles,'Belleza'],['Barbería',Scissors,'Barbería'],['Spa',Leaf,'Spa'],
  ['Viajes',Plane,'Viajes'],['Tatuajes',Palette,'Tatuajes'],['Abogados',Scale,'Abogados'],['Otros',MoreHorizontal,'']
] as const;

export default async function AndroidHome(){
  const {data:session}=await auth.getSession();
  let role='';
  if(session?.user && sql){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    role=String((rows[0] as any)?.role||'PATIENT');
  }

  const rows=sql?await sql`
    SELECT d.public_slug,d.provider_category,d.provider_activity,d.bio,u.full_name,l.city,l.state,l.country
    FROM doctors d
    JOIN users u ON u.id=d.user_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
    WHERE u.active=true AND d.accepts_online_booking=true
    ORDER BY d.created_at DESC
    LIMIT 10
  `:[];

  const providers:any[]=[];
  const seen=new Set<string>();
  for(const row of rows as any[]){
    const slug=String(row.public_slug||'');
    if(!slug||seen.has(slug)) continue;
    seen.add(slug);
    providers.push(row);
    if(providers.length>=4) break;
  }

  const profile=role==='DOCTOR'?'/medico#perfil':role==='MASTER'?'/master/configuracion':role==='CLINIC_ADMIN'||role==='RECEPTION'?'/recepcion':'/paciente/perfil';
  const agenda=role==='DOCTOR'?'/medico/agenda':role==='CLINIC_ADMIN'||role==='RECEPTION'?'/recepcion/agenda':'/paciente';

  return <main className={styles.shell}>
    <header className={styles.header}>
      <div className={styles.brand}><img src="/icons/tucita-brand.svg" alt="TUCITA"/><strong>TUCITA</strong></div>
      <Link className={styles.avatar} href={session?.user?profile:'/ingresar'} aria-label="Cuenta"><UserRound size={19}/></Link>
    </header>

    <div className={styles.location}><MapPin size={14}/><span>Encuentra servicios cerca de ti</span></div>

    <form action="/explorar" className={styles.search}>
      <Search size={18}/><input name="q" placeholder="Buscar servicio, profesional o zona..."/>
    </form>

    <section className={styles.categories}>
      {cats.map(([label,Icon,category],i)=><Link key={label} href={category?'/explorar?category='+encodeURIComponent(category):'/explorar'} className={styles.category}>
        <span className={styles['c'+(i+1)]}><Icon size={22}/></span><small>{label}</small>
      </Link>)}
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div><h1>{session?.user?'Tu TUCITA':'Profesionales disponibles'}</h1><p>Agenda, paga y confirma desde tu teléfono.</p></div>
        <Link href="/explorar">Ver todos</Link>
      </div>

      <div className={styles.cards}>
        {providers.map((p:any)=>{const media=parseProviderMedia(p.bio);return <Link href={'/reservar/'+p.public_slug} className={styles.provider} key={p.public_slug}>
          <div className={styles.photo}>{media.profileImage?<img src={media.profileImage} alt=""/>:<UserRound size={29}/>}</div>
          <div className={styles.copy}><strong>{p.full_name}</strong><span>{p.provider_activity||p.provider_category||'Servicio profesional'}</span><small><MapPin size={11}/>{[p.city,p.state,p.country].filter(Boolean).join(' · ')||'Ubicación disponible'}</small></div>
          <ArrowRight size={16}/>
        </Link>})}
      </div>
    </section>

    {!session?.user&&<section className={styles.welcome}>
      <div><strong>Bienvenido a TUCITA</strong><span>Agenda · Paga · Confirma</span></div>
      <div className={styles.actions}><Link href="/ingresar">Iniciar sesión</Link><Link href="/registro">Crear cuenta</Link></div>
    </section>}

    <nav className={styles.bottom}>
      <Link href="/android" className={styles.active}><Home size={21}/><span>Inicio</span></Link>
      <Link href="/explorar"><Search size={21}/><span>Buscar</span></Link>
      <Link href={session?.user?agenda:'/ingresar'}><CalendarDays size={21}/><span>Reservas</span></Link>
      <Link href={session?.user?profile:'/ingresar'}><UserRound size={21}/><span>Perfil</span></Link>
    </nav>
  </main>;
}
