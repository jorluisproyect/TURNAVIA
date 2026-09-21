import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';
import { refreshCommercialClientByEmail, subscriptionAllowed } from '@/lib/subscription';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function slotList(block:any,appointments:any[],durationMinutes:number){
  const out:any[]=[];
  const blockStart=new Date(block.starts_at).getTime();
  const blockEnd=new Date(block.ends_at).getTime();
  const step=Math.max(5,Number(block.slot_minutes||15))*60000;
  const duration=Math.max(5,durationMinutes)*60000;
  const now=Date.now();

  for(let t=blockStart;t+duration<=blockEnd;t+=step){
    const slotEnd=t+duration;
    const busy=appointments.some(a=>{
      if(['CANCELLED','PAYMENT_REJECTED'].includes(String(a.status))) return false;
      const aStart=new Date(a.starts_at).getTime();
      const aEnd=new Date(a.ends_at).getTime();
      return aStart<slotEnd && aEnd>t;
    });
    out.push({
      startsAt:new Date(t).toISOString(),
      endsAt:new Date(slotEnd).toISOString(),
      time:new Date(t).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'}),
      available:t>=now&&!busy
    });
  }
  return out;
}

async function providerBySlug(slug:string){
  if(!sql) return null;
  const rows=await sql`SELECT d.id,d.public_slug,d.specialty,d.provider_category,d.provider_activity,d.provider_type,
      d.consultation_price,d.consultation_currency,d.payment_instructions,d.default_appointment_minutes,d.accepts_online_booking,
      u.full_name,u.phone,u.email,u.organization_id,o.email AS organization_email,l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room
    FROM doctors d JOIN users u ON u.id=d.user_id
    LEFT JOIN organizations o ON o.id=u.organization_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id
    WHERE d.public_slug=${slug} AND u.active=true LIMIT 1`;
  return rows[0] as any || null;
}

export async function GET(req:Request,ctx:{params:Promise<{slug:string}>}){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {slug}=await ctx.params;
  const p=await providerBySlug(slug);
  if(!p) return NextResponse.json({error:'Profesional o negocio no encontrado'},{status:404});
  const commercial=await refreshCommercialClientByEmail(String(p.organization_email||p.email||''));
  if(commercial&&!subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Esta agenda está temporalmente fuera de servicio.'},{status:403});
  if(!p.accepts_online_booking) return NextResponse.json({error:'Las reservas en línea están pausadas'},{status:403});

  const services=await sql`SELECT id,name,description,duration_minutes,price,currency FROM provider_services WHERE doctor_id=${p.id} AND active=true ORDER BY created_at`;
  const requestedServiceId=new URL(req.url).searchParams.get('serviceId');
  const chosen=(services as any[]).find(s=>String(s.id)===requestedServiceId)||(services as any[])[0];
  const durationMinutes=Math.max(5,Number(chosen?.duration_minutes||p.default_appointment_minutes||30));

  const blocks=await sql`SELECT id,starts_at,ends_at,slot_minutes FROM availability_blocks WHERE doctor_id=${p.id} AND published=true AND ends_at>=now() ORDER BY starts_at LIMIT 60`;
  const aps=await sql`SELECT starts_at,ends_at,status FROM appointments WHERE doctor_id=${p.id} AND ends_at>=now()-interval '1 day'`;
  const statusRows=await sql`SELECT status,delay_minutes FROM doctor_status_updates WHERE doctor_id=${p.id} ORDER BY updated_at DESC LIMIT 1`;

  const availability=blocks.map((b:any)=>({
    id:String(b.id),
    date:new Date(b.starts_at).toLocaleDateString('en-CA',{timeZone:'America/Caracas'}),
    startsAt:new Date(b.starts_at).toISOString(),
    endsAt:new Date(b.ends_at).toISOString(),
    slots:slotList(b,aps as any[],durationMinutes)
  }));
  const initials=String(p.full_name||'T').replace(/^(Dr\.?|Dra\.?)\s*/i,'').split(/\s+/).slice(0,2).map((x:string)=>x[0]||'').join('').toUpperCase();

  return NextResponse.json({
    provider:{
      slug:p.public_slug,name:p.full_name,initials,category:p.provider_category||'Otro',activity:p.provider_activity||p.specialty||'Servicio',
      type:p.provider_type||'Profesional independiente',phone:p.phone||'',specialty:p.specialty||'',
      location:[p.location_name,p.address,p.city,p.state,p.country].filter(Boolean).join(' · '),
      country:p.country||'',
      dayStatus:(statusRows[0] as any)?.status||'NORMAL',delayMinutes:Number((statusRows[0] as any)?.delay_minutes||0)
    },
    services:services.map((s:any)=>({id:String(s.id),name:s.name,description:s.description||'',durationMinutes:Number(s.duration_minutes),price:Number(s.price),currency:s.currency||'USD'})),
    availability,
    selectedServiceDuration:durationMinutes,
    paymentInstructions:p.payment_instructions||''
  });
}

export async function POST(req:Request,ctx:{params:Promise<{slug:string}>}){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {slug}=await ctx.params;
  const p=await providerBySlug(slug);
  if(!p) return NextResponse.json({error:'Profesional o negocio no encontrado'},{status:404});
  const commercial=await refreshCommercialClientByEmail(String(p.organization_email||p.email||''));
  if(commercial&&!subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Esta agenda está temporalmente fuera de servicio.'},{status:403});
  const body=await req.json();
  const startsAt=String(body.startsAt||'');
  const clientName=String(body.clientName||'').trim();
  const phone=String(body.phone||'').trim();
  const email=String(body.email||'').trim().toLowerCase();
  const reference=String(body.paymentReference||'').trim();
  const proof=String(body.paymentProofDataUrl||'');
  const paymentMethod=String(body.paymentMethod||'').trim();
  if(!startsAt||!clientName||!phone||!email||!paymentMethod||!body.policyAccepted){
    return NextResponse.json({error:'Completa tus datos, método de pago y acepta la política.'},{status:400});
  }
  if(proof.length>3_000_000) return NextResponse.json({error:'El comprobante es demasiado grande.'},{status:413});

  if(clientName.length>120||phone.length>40||email.length>200||String(body.note||'').length>600||reference.length>160){
    return NextResponse.json({error:'Uno de los campos supera el tamaño permitido.'},{status:400});
  }
  if(!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({error:'Escribe un correo válido.'},{status:400});

  const methodRows=await sql`SELECT pm.requires_proof
    FROM payment_methods pm
    JOIN doctors md ON md.id=pm.doctor_id
    JOIN users mu ON mu.id=md.user_id
    WHERE pm.scope='DOCTOR' AND pm.active=true AND lower(pm.name)=lower(${paymentMethod})
      AND (
        pm.doctor_id=${p.id}
        OR (${p.organization_id}::uuid IS NOT NULL AND mu.organization_id=${p.organization_id})
      )
    ORDER BY CASE WHEN pm.doctor_id=${p.id} THEN 0 ELSE 1 END,mu.created_at ASC,pm.created_at ASC
    LIMIT 1`;
  const method=methodRows[0] as any;
  if(!method) return NextResponse.json({error:'Método de pago no disponible.'},{status:409});
  const requiresProof=method.requires_proof!==false;
  if(requiresProof&&(!reference||!proof)) return NextResponse.json({error:'Este método requiere referencia y comprobante de pago.'},{status:400});
  if(requiresProof&&!/^data:(image\/(jpeg|png|webp)|application\/pdf);base64,/i.test(proof)) return NextResponse.json({error:'Formato de comprobante no permitido.'},{status:400});
  const recent=await sql`SELECT count(*)::int AS n
    FROM appointments a JOIN patients pat ON pat.id=a.patient_id
    WHERE a.created_at>now()-interval '10 minutes'
      AND (lower(pat.email)=lower(${email}) OR pat.phone=${phone})`;
  if(Number((recent[0] as any)?.n||0)>=5) return NextResponse.json({error:'Has realizado varias solicitudes seguidas. Espera unos minutos e intenta nuevamente.'},{status:429});
  const initialStatus=requiresProof?'PAYMENT_REVIEW':'CONFIRMED';

  const serviceRows=await sql`SELECT id,name,duration_minutes,price,currency FROM provider_services WHERE id=${body.serviceId}::uuid AND doctor_id=${p.id} AND active=true LIMIT 1`;
  const service=serviceRows[0] as any;
  if(!service) return NextResponse.json({error:'Servicio no disponible'},{status:404});

  const duration=Math.max(5,Number(service.duration_minutes||30));
  const requestedStart=new Date(startsAt);
  if(Number.isNaN(requestedStart.getTime())) return NextResponse.json({error:'Horario inválido'},{status:400});
  const requestedEnd=new Date(requestedStart.getTime()+duration*60000);

  let patientRows=await sql`SELECT id FROM patients WHERE lower(email)=lower(${email}) OR phone=${phone} ORDER BY created_at DESC LIMIT 1`;
  let patientId=(patientRows[0] as any)?.id;
  if(patientId){
    await sql`UPDATE patients SET full_name=${clientName},phone=${phone},email=${email},national_id=COALESCE(${String(body.nationalId||'')||null},national_id) WHERE id=${patientId}`;
  }else{
    const rows=await sql`INSERT INTO patients(full_name,national_id,phone,email) VALUES(${clientName},${String(body.nationalId||'')||null},${phone},${email}) RETURNING id`;
    patientId=(rows[0] as any)?.id;
  }

  if(!p.location_id) return NextResponse.json({error:'Este profesional aún no configuró su ubicación.'},{status:409});

  // One SQL statement + advisory lock serializes bookings for the same provider.
  // This prevents two clients from taking overlapping slots at the same instant.
  const rows=await sql`
    WITH provider_lock AS (
      SELECT pg_advisory_xact_lock(hashtext(${String(p.id)})::bigint)
    ),
    valid_block AS (
      SELECT ab.id
      FROM availability_blocks ab, provider_lock
      WHERE ab.doctor_id=${p.id}
        AND ab.published=true
        AND ab.starts_at<=${requestedStart.toISOString()}::timestamptz
        AND ab.ends_at>=${requestedEnd.toISOString()}::timestamptz
      LIMIT 1
    ),
    inserted AS (
      INSERT INTO appointments(doctor_id,patient_id,location_id,starts_at,ends_at,status,source,reason_short,service_id,service_name,consultation_price,consultation_currency,payment_method,payment_reference,payment_proof_url,payment_submitted_at,reschedule_used,policy_accepted)
      SELECT ${p.id},${patientId},${p.location_id},${requestedStart.toISOString()}::timestamptz,${requestedEnd.toISOString()}::timestamptz,${initialStatus}::appointment_status,'PATIENT_WEB',${String(body.note||'')||null},${service.id},${service.name},${Number(service.price||0)},${service.currency||'USD'},${paymentMethod},${reference||null},${proof||null},now(),false,true
      FROM valid_block
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.doctor_id=${p.id}
          AND a.status NOT IN ('CANCELLED','PAYMENT_REJECTED')
          AND a.starts_at<${requestedEnd.toISOString()}::timestamptz
          AND a.ends_at>${requestedStart.toISOString()}::timestamptz
      )
      RETURNING id
    )
    SELECT id FROM inserted`;

  if(!rows.length) return NextResponse.json({error:'Ese horario ya no está disponible o acaba de ser reservado. Elige otro.'},{status:409});
  const appointmentId=String((rows[0] as any)?.id);
  const when=requestedStart.toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'});
  if(initialStatus==='CONFIRMED'){
    await sendTransactionalEmail({to:email,subject:'Tu reserva TURNAVIA fue confirmada',html:turnaviaEmail('Reserva confirmada',`<p>Hola <strong>${clientName}</strong>.</p><p>Tu reserva quedó confirmada.</p><p><strong>Servicio:</strong> ${service.name}<br/><strong>Con:</strong> ${p.full_name}<br/><strong>Fecha y hora:</strong> ${when}</p>`)});
  }else{
    await sendTransactionalEmail({to:email,subject:'Recibimos tu reserva TURNAVIA',html:turnaviaEmail('Reserva preagendada',`<p>Hola <strong>${clientName}</strong>.</p><p>Recibimos tu reserva y comprobante. El profesional o negocio revisará el pago antes de confirmarla.</p><p><strong>Servicio:</strong> ${service.name}<br/><strong>Con:</strong> ${p.full_name}<br/><strong>Fecha y hora:</strong> ${when}</p>`)});
  }
  const providerEmail=String(p.organization_email||p.email||'').trim();
  if(providerEmail){
    await sendTransactionalEmail({to:providerEmail,subject:'Nueva reserva en TURNAVIA',html:turnaviaEmail('Nueva reserva recibida',`<p><strong>${clientName}</strong> reservó <strong>${service.name}</strong> con ${p.full_name}.</p><p><strong>Fecha y hora:</strong> ${when}<br/><strong>Monto:</strong> ${service.currency||'USD'} ${Number(service.price||0)}<br/><strong>Estado:</strong> ${initialStatus==='CONFIRMED'?'Confirmada':'Pago por revisar'}</p><p><a href="${process.env.APP_URL||'https://turnavia.vercel.app'}/panel">Abrir TURNAVIA</a></p>`)});
  }
  return NextResponse.json({ok:true,appointmentId,status:initialStatus},{status:201});
}
