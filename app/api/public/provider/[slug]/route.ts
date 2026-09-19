import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function slotList(block:any,appointments:any[]){
  const out:any[]=[];
  const start=new Date(block.starts_at).getTime();
  const end=new Date(block.ends_at).getTime();
  const step=Math.max(5,Number(block.slot_minutes||30))*60000;
  for(let t=start;t+step<=end;t+=step){
    const iso=new Date(t).toISOString();
    const busy=appointments.some(a=>new Date(a.starts_at).getTime()===t && !['CANCELLED','PAYMENT_REJECTED'].includes(String(a.status)));
    out.push({startsAt:iso,time:new Date(t).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'}),available:!busy});
  }
  return out;
}

async function providerBySlug(slug:string){
  if(!sql) return null;
  const rows=await sql`SELECT d.id,d.public_slug,d.specialty,d.provider_category,d.provider_activity,d.provider_type,
      d.consultation_price,d.consultation_currency,d.payment_instructions,d.default_appointment_minutes,d.accepts_online_booking,
      u.full_name,u.phone,u.email,l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room
    FROM doctors d JOIN users u ON u.id=d.user_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    WHERE d.public_slug=${slug} AND u.active=true LIMIT 1`;
  return rows[0] as any || null;
}

export async function GET(_req:Request,ctx:{params:Promise<{slug:string}>}){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {slug}=await ctx.params;
  const p=await providerBySlug(slug);
  if(!p) return NextResponse.json({error:'Profesional o negocio no encontrado'},{status:404});
  if(!p.accepts_online_booking) return NextResponse.json({error:'Las reservas en línea están pausadas'},{status:403});

  const services=await sql`SELECT id,name,description,duration_minutes,price,currency FROM provider_services WHERE doctor_id=${p.id} AND active=true ORDER BY created_at`;
  const blocks=await sql`SELECT id,starts_at,ends_at,slot_minutes FROM availability_blocks WHERE doctor_id=${p.id} AND published=true AND ends_at>=now() ORDER BY starts_at LIMIT 40`;
  const aps=await sql`SELECT starts_at,status FROM appointments WHERE doctor_id=${p.id} AND starts_at>=now()-interval '1 day'`;
  const statusRows=await sql`SELECT status,delay_minutes FROM doctor_status_updates WHERE doctor_id=${p.id} ORDER BY updated_at DESC LIMIT 1`;

  const availability=blocks.map((b:any)=>({
    id:String(b.id),
    date:new Date(b.starts_at).toLocaleDateString('en-CA',{timeZone:'America/Caracas'}),
    slots:slotList(b,aps as any[])
  }));
  const initials=String(p.full_name||'T').replace(/^(Dr\.?|Dra\.?)\s*/i,'').split(/\s+/).slice(0,2).map((x:string)=>x[0]||'').join('').toUpperCase();

  return NextResponse.json({
    provider:{
      slug:p.public_slug,name:p.full_name,initials,category:p.provider_category||'Otro',activity:p.provider_activity||p.specialty||'Servicio',
      type:p.provider_type||'Profesional independiente',phone:p.phone||'',specialty:p.specialty||'',
      location:[p.location_name,p.address,p.city].filter(Boolean).join(' · '),
      dayStatus:(statusRows[0] as any)?.status||'NORMAL',delayMinutes:Number((statusRows[0] as any)?.delay_minutes||0)
    },
    services:services.map((s:any)=>({id:String(s.id),name:s.name,description:s.description||'',durationMinutes:Number(s.duration_minutes),price:Number(s.price),currency:s.currency||'USD'})),
    availability,
    paymentInstructions:p.payment_instructions||''
  });
}

export async function POST(req:Request,ctx:{params:Promise<{slug:string}>}){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {slug}=await ctx.params;
  const p=await providerBySlug(slug);
  if(!p) return NextResponse.json({error:'Profesional o negocio no encontrado'},{status:404});
  const body=await req.json();
  const startsAt=String(body.startsAt||'');
  const clientName=String(body.clientName||'').trim();
  const phone=String(body.phone||'').trim();
  const email=String(body.email||'').trim().toLowerCase();
  const reference=String(body.paymentReference||'').trim();
  const proof=String(body.paymentProofDataUrl||'');
  if(!startsAt||!clientName||!phone||!email||!reference||!proof||!body.policyAccepted){
    return NextResponse.json({error:'Completa tus datos, referencia, comprobante y acepta la política.'},{status:400});
  }
  if(proof.length>3_000_000) return NextResponse.json({error:'El comprobante es demasiado grande.'},{status:413});

  const serviceRows=await sql`SELECT id,name,duration_minutes,price,currency FROM provider_services WHERE id=${body.serviceId}::uuid AND doctor_id=${p.id} AND active=true LIMIT 1`;
  const service=serviceRows[0] as any;
  if(!service) return NextResponse.json({error:'Servicio no disponible'},{status:404});

  const taken=await sql`SELECT id FROM appointments WHERE doctor_id=${p.id} AND starts_at=${startsAt}::timestamptz AND status NOT IN ('CANCELLED','PAYMENT_REJECTED') LIMIT 1`;
  if(taken.length) return NextResponse.json({error:'Ese horario acaba de ser reservado. Elige otro.'},{status:409});

  let patientRows=await sql`SELECT id FROM patients WHERE lower(email)=lower(${email}) OR phone=${phone} ORDER BY created_at DESC LIMIT 1`;
  let patientId=(patientRows[0] as any)?.id;
  if(patientId){
    await sql`UPDATE patients SET full_name=${clientName},phone=${phone},email=${email},national_id=COALESCE(${String(body.nationalId||'')||null},national_id) WHERE id=${patientId}`;
  }else{
    const rows=await sql`INSERT INTO patients(full_name,national_id,phone,email) VALUES(${clientName},${String(body.nationalId||'')||null},${phone},${email}) RETURNING id`;
    patientId=(rows[0] as any)?.id;
  }

  if(!p.location_id) return NextResponse.json({error:'Este profesional aún no configuró su ubicación.'},{status:409});
  const duration=Math.max(5,Number(service.duration_minutes||30));
  const rows=await sql`INSERT INTO appointments(doctor_id,patient_id,location_id,starts_at,ends_at,status,source,reason_short,service_id,service_name,consultation_price,consultation_currency,payment_method,payment_reference,payment_proof_url,payment_submitted_at,reschedule_used,policy_accepted)
    VALUES(${p.id},${patientId},${p.location_id},${startsAt}::timestamptz,${startsAt}::timestamptz + (${duration}||' minutes')::interval,'PAYMENT_REVIEW','PATIENT_WEB',${String(body.note||'')||null},${service.id},${service.name},${Number(service.price||0)},${service.currency||'USD'},${String(body.paymentMethod||'')},${reference},${proof},now(),false,true)
    RETURNING id`;
  return NextResponse.json({ok:true,appointmentId:String((rows[0] as any)?.id)},{status:201});
}
