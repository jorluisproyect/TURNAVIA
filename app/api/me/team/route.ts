import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function slugify(input:string){
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,38)||'profesional';
}

async function context(){
  if(!sql) return null;
  const {data:session}=await auth.getSession();
  if(!session?.user) return null;
  const email=String((session.user as any).email||'').toLowerCase();
  const rows=await sql`SELECT u.id AS user_id,u.organization_id,d.id AS doctor_id,d.provider_type,o.name AS organization_name,o.slug AS organization_slug
    FROM users u
    JOIN doctors d ON d.user_id=u.id
    LEFT JOIN organizations o ON o.id=u.organization_id
    WHERE lower(u.email)=lower(${email}) AND u.active=true
    LIMIT 1`;
  return (rows[0] as any)||null;
}

async function memberAllowed(ctx:any,doctorId:string){
  if(!sql||!ctx?.organization_id) return null;
  const rows=await sql`SELECT d.id,d.user_id,u.full_name,u.email,u.phone,d.public_slug,d.provider_category,d.provider_activity
    FROM doctors d JOIN users u ON u.id=d.user_id
    WHERE d.id=${doctorId}::uuid AND u.organization_id=${ctx.organization_id} AND u.active=true
    LIMIT 1`;
  return (rows[0] as any)||null;
}

export async function GET(){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const ctx=await context();
  if(!ctx) return NextResponse.json({error:'No autorizado'},{status:401});
  if(!ctx.organization_id) return NextResponse.json({business:false,team:[]});

  const members=await sql`SELECT d.id AS doctor_id,d.public_slug,d.provider_category,d.provider_activity,d.specialty,
      u.id AS user_id,u.full_name,u.email,u.phone,
      l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country
    FROM users u
    JOIN doctors d ON d.user_id=u.id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    WHERE u.organization_id=${ctx.organization_id} AND u.role='DOCTOR' AND u.active=true
    ORDER BY u.created_at ASC`;

  const team=[];
  for(const m of members as any[]){
    const services=await sql`SELECT id,name,description,duration_minutes,price,currency,active FROM provider_services WHERE doctor_id=${m.doctor_id} ORDER BY active DESC,created_at`;
    const availability=await sql`SELECT id,starts_at,ends_at,slot_minutes,published FROM availability_blocks WHERE doctor_id=${m.doctor_id} AND ends_at>=now()-interval '1 day' ORDER BY starts_at LIMIT 50`;
    team.push({
      id:String(m.doctor_id),userId:String(m.user_id),name:m.full_name,email:m.email||'',phone:m.phone||'',slug:m.public_slug,
      category:m.provider_category||'',activity:m.provider_activity||m.specialty||'Servicio',
      isOwner:String(m.doctor_id)===String(ctx.doctor_id),
      location:{id:m.location_id?String(m.location_id):'',name:m.location_name||'',address:m.address||'',city:m.city||'',state:m.state||'',country:m.country||'Venezuela'},
      services:services.map((s:any)=>({id:String(s.id),name:s.name,description:s.description||'',durationMinutes:Number(s.duration_minutes),price:Number(s.price),currency:s.currency||'USD',active:Boolean(s.active)})),
      availability:availability.map((a:any)=>({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),slotMinutes:Number(a.slot_minutes),published:Boolean(a.published)}))
    });
  }

  return NextResponse.json({business:true,organization:{id:String(ctx.organization_id),name:ctx.organization_name,slug:ctx.organization_slug},maxProfessionals:5,team});
}

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const ctx=await context();
  if(!ctx) return NextResponse.json({error:'No autorizado'},{status:401});
  if(!ctx.organization_id) return NextResponse.json({error:'La gestión de equipo está disponible para cuentas Negocio / local.'},{status:403});
  const body=await req.json();
  const action=String(body.action||'');

  if(action==='add_member'){
    const countRows=await sql`SELECT count(*)::int AS n FROM users WHERE organization_id=${ctx.organization_id} AND role='DOCTOR' AND active=true`;
    if(Number((countRows[0] as any)?.n||0)>=5) return NextResponse.json({error:'Tu plan admite hasta 5 profesionales activos.'},{status:409});
    const name=String(body.name||'').trim();
    const activity=String(body.activity||'').trim()||'Servicio';
    const category=String(body.category||'').trim()||'Otro';
    const phone=String(body.phone||'').trim();
    const email=String(body.email||'').trim().toLowerCase();
    if(!name) return NextResponse.json({error:'Escribe el nombre del profesional.'},{status:400});
    if(email){
      const dupe=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
      if(dupe.length) return NextResponse.json({error:'Ese correo ya pertenece a otra cuenta o profesional.'},{status:409});
    }
    const userRows=await sql`INSERT INTO users(organization_id,role,full_name,email,phone,active)
      VALUES(${ctx.organization_id},'DOCTOR',${name},${email||null},${phone||null},true) RETURNING id`;
    const userId=(userRows[0] as any).id;
    const slug=slugify(name)+'-'+randomUUID().slice(0,6);
    const doctorRows=await sql`INSERT INTO doctors(user_id,public_slug,specialty,provider_category,provider_activity,provider_type,consultation_price,consultation_currency,accepts_online_booking)
      VALUES(${userId},${slug},${activity},${category},${activity},'Negocio / local',0,'USD',true) RETURNING id`;
    const doctorId=(doctorRows[0] as any).id;
    const locRows=await sql`SELECT id FROM locations WHERE organization_id=${ctx.organization_id} AND active=true ORDER BY created_at LIMIT 1`;
    let locationId=(locRows[0] as any)?.id;
    if(!locationId){
      const ownerLoc=await sql`SELECT location_id AS id FROM doctor_locations WHERE doctor_id=${ctx.doctor_id} LIMIT 1`;
      locationId=(ownerLoc[0] as any)?.id;
    }
    if(locationId) await sql`INSERT INTO doctor_locations(doctor_id,location_id) VALUES(${doctorId},${locationId}) ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO provider_services(doctor_id,name,duration_minutes,price,currency,active) VALUES(${doctorId},${activity},30,0,'USD',true)`;
    return NextResponse.json({ok:true,doctorId:String(doctorId),slug},{status:201});
  }

  const doctorId=String(body.doctorId||'');
  if(!doctorId) return NextResponse.json({error:'Falta identificar al profesional.'},{status:400});
  const member=await memberAllowed(ctx,doctorId);
  if(!member) return NextResponse.json({error:'Profesional no encontrado en tu negocio.'},{status:404});

  if(action==='update_member'){
    const name=String(body.name||member.full_name).trim();
    const phone=String(body.phone??member.phone??'').trim();
    const activity=String(body.activity||member.provider_activity||'Servicio').trim();
    const category=String(body.category||member.provider_category||'Otro').trim();
    await sql`UPDATE users SET full_name=${name},phone=${phone||null} WHERE id=${member.user_id}`;
    await sql`UPDATE doctors SET specialty=${activity},provider_activity=${activity},provider_category=${category} WHERE id=${doctorId}::uuid`;
    return NextResponse.json({ok:true});
  }

  if(action==='remove_member'){
    if(String(doctorId)===String(ctx.doctor_id)) return NextResponse.json({error:'No puedes desactivar al propietario desde el equipo.'},{status:400});
    await sql`UPDATE users SET active=false WHERE id=${member.user_id}`;
    return NextResponse.json({ok:true});
  }

  if(action==='add_service'){
    const name=String(body.name||'').trim();
    if(!name) return NextResponse.json({error:'Escribe el nombre del servicio.'},{status:400});
    await sql`INSERT INTO provider_services(doctor_id,name,description,duration_minutes,price,currency,active)
      VALUES(${doctorId}::uuid,${name},${String(body.description||'')||null},${Math.max(5,Number(body.durationMinutes||30))},${Math.max(0,Number(body.price||0))},${String(body.currency||'USD')},true)`;
    return NextResponse.json({ok:true});
  }

  if(action==='update_service'){
    await sql`UPDATE provider_services SET
      name=COALESCE(${body.name||null},name),
      description=COALESCE(${body.description??null},description),
      duration_minutes=COALESCE(${body.durationMinutes?Math.max(5,Number(body.durationMinutes)):null},duration_minutes),
      price=COALESCE(${body.price!==undefined?Math.max(0,Number(body.price)):null},price),
      currency=COALESCE(${body.currency||null},currency),
      active=COALESCE(${typeof body.active==='boolean'?body.active:null},active),
      updated_at=now()
      WHERE id=${String(body.serviceId||'')}::uuid AND doctor_id=${doctorId}::uuid`;
    return NextResponse.json({ok:true});
  }

  if(action==='add_availability'){
    const date=String(body.date||''),start=String(body.start||''),end=String(body.end||'');
    if(!date||!start||!end) return NextResponse.json({error:'Completa fecha y horario.'},{status:400});
    const startsAt=new Date(`${date}T${start}:00-04:00`);
    const endsAt=new Date(`${date}T${end}:00-04:00`);
    if(Number.isNaN(startsAt.getTime())||Number.isNaN(endsAt.getTime())||endsAt<=startsAt) return NextResponse.json({error:'La hora final debe ser posterior a la inicial.'},{status:400});
    const loc=await sql`SELECT location_id FROM doctor_locations WHERE doctor_id=${doctorId}::uuid LIMIT 1`;
    const locationId=(loc[0] as any)?.location_id;
    if(!locationId) return NextResponse.json({error:'Este profesional no tiene ubicación asignada.'},{status:409});
    await sql`INSERT INTO availability_blocks(doctor_id,location_id,starts_at,ends_at,slot_minutes,published)
      VALUES(${doctorId}::uuid,${locationId},${startsAt.toISOString()}::timestamptz,${endsAt.toISOString()}::timestamptz,${Math.max(5,Number(body.slotMinutes||15))},true)`;
    return NextResponse.json({ok:true});
  }

  if(action==='delete_availability'){
    await sql`DELETE FROM availability_blocks WHERE id=${String(body.availabilityId||'')}::uuid AND doctor_id=${doctorId}::uuid`;
    return NextResponse.json({ok:true});
  }

  return NextResponse.json({error:'Acción inválida'},{status:400});
}
