import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';
import { refreshCommercialClientByEmail, subscriptionAllowed } from '@/lib/subscription';
import { buildAppointmentReceiptPdf } from '@/lib/appointment-receipt';
import { randomUUID } from 'crypto';
import { parseProviderMedia } from '@/lib/provider-media';
import { isTravelProvider, travelServiceFields, serializeTravelParty, travelPartyFromReason } from '@/lib/travel-service';
import { parseServiceMedia } from '@/lib/service-media';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function slotList(block:any,appointments:any[],durationMinutes:number){
  const out:any[]=[];
  const blockStart=new Date(block.starts_at).getTime();
  const blockEnd=new Date(block.ends_at).getTime();
  const duration=Math.max(5,durationMinutes)*60000;
  const now=Date.now();

  const busyIntervals=appointments
    .filter(a=>!['CANCELLED','PAYMENT_REJECTED'].includes(String(a.status)))
    .map(a=>({start:new Date(a.starts_at).getTime(),end:new Date(a.ends_at).getTime()}))
    .filter(a=>Number.isFinite(a.start)&&Number.isFinite(a.end)&&a.end>blockStart&&a.start<blockEnd)
    .sort((a,b)=>a.start-b.start);

  let cursor=blockStart;
  let guard=0;

  while(cursor+duration<=blockEnd && guard<500){
    guard++;
    const candidateEnd=cursor+duration;
    const overlapping=busyIntervals.filter(a=>a.start<candidateEnd&&a.end>cursor);

    if(overlapping.length){
      // La próxima opción comienza exactamente cuando termina la cita que ocupa
      // este tramo. Así un servicio de 45 min a las 9:00 habilita 9:45.
      const next=Math.max(...overlapping.map(a=>a.end));
      if(next<=cursor)break;
      cursor=next;
      continue;
    }

    if(cursor>=now){
      out.push({
        startsAt:new Date(cursor).toISOString(),
        endsAt:new Date(candidateEnd).toISOString(),
        time:new Date(cursor).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'}),
        available:true
      });
    }

    // Si está libre, la siguiente opción avanza exactamente la duración
    // del servicio seleccionado, nunca un intervalo manual.
    cursor=candidateEnd;
  }

  return out;
}

async function providerBySlug(slug:string){
  if(!sql) return null;
  const rows=await sql`SELECT d.id,d.public_slug,d.specialty,d.provider_category,d.provider_activity,d.provider_type,
      d.consultation_price,d.consultation_currency,d.payment_instructions,d.default_appointment_minutes,d.accepts_online_booking,d.bio,
      u.full_name,u.phone,u.email,u.organization_id,o.email AS organization_email,l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room
    FROM doctors d
    JOIN users u ON u.id=d.user_id
    JOIN app_user_profiles ap ON lower(ap.email)=lower(u.email) AND ap.role::text='DOCTOR'
    JOIN neon_auth."user" au ON lower(au.email)=lower(u.email)
    LEFT JOIN organizations o ON o.id=u.organization_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
      AND EXISTS (SELECT 1 FROM locations lx WHERE lx.id=dl.location_id AND lx.active=true)
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
    WHERE d.public_slug=${slug} AND u.active=true LIMIT 1`;
  return rows[0] as any || null;
}

export async function GET(req:Request,ctx:{params:Promise<{slug:string}>}){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {slug}=await ctx.params;
  const p=await providerBySlug(slug);
  if(!p) return NextResponse.json({error:'Profesional o negocio no encontrado'},{status:404});
  const commercial=await refreshCommercialClientByEmail(String(p.organization_email||p.email||''));
  if(!commercial||!subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Esta agenda está temporalmente fuera de servicio.'},{status:403});
  if(!p.accepts_online_booking) return NextResponse.json({error:'Las reservas en línea están pausadas'},{status:403});

  const services=await sql`SELECT id,name,description,duration_minutes,price,currency FROM provider_services WHERE doctor_id=${p.id} AND active=true ORDER BY created_at`;
  const requestedServiceId=new URL(req.url).searchParams.get('serviceId');
  const chosen=(services as any[]).find(s=>String(s.id)===requestedServiceId)||(services as any[])[0];
  const chosenTravel=travelServiceFields(chosen?.description||'');
  const travelMode=isTravelProvider(p.provider_category,p.provider_activity);
  const durationMinutes=Math.max(5,Number(chosen?.duration_minutes||p.default_appointment_minutes||30));

  const blocks=await sql`SELECT ab.id,ab.starts_at,ab.ends_at,ab.max_patients,
      l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room
    FROM availability_blocks ab
    JOIN locations l ON l.id=ab.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=ab.doctor_id AND dl.location_id=ab.location_id
    WHERE ab.doctor_id=${p.id} AND ab.published=true AND ab.ends_at>=now()
    ORDER BY ab.starts_at LIMIT 120`;
  const aps=await sql`SELECT service_id,starts_at,ends_at,status,reason_short FROM appointments WHERE doctor_id=${p.id} AND ends_at>=now()-interval '1 day'`;
  const statusRows=await sql`SELECT status,delay_minutes FROM doctor_status_updates WHERE doctor_id=${p.id} ORDER BY updated_at DESC LIMIT 1`;

  const availability=blocks.map((b:any)=>{
    const date=new Date(b.starts_at).toLocaleDateString('en-CA',{timeZone:'America/Caracas'});
    const localTime=new Date(b.starts_at).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
    const travelMatch=!travelMode||(
      (!chosenTravel.travelDate||date===chosenTravel.travelDate)&&
      (!chosenTravel.departureTime||localTime===chosenTravel.departureTime)&&
      (!chosenTravel.locationId||String(b.location_id)===chosenTravel.locationId)
    );
    if(!travelMatch)return null;
    let slots:any[];
    if(travelMode&&chosen){
      const capacity=Math.max(1,Number(chosenTravel.capacity||b.max_patients||1));
      const used=(aps as any[]).filter(a=>String(a.service_id||'')===String(chosen.id)&&!['CANCELLED','PAYMENT_REJECTED'].includes(String(a.status))&&new Date(a.starts_at).getTime()===new Date(b.starts_at).getTime()).reduce((sum,a)=>sum+travelPartyFromReason(a.reason_short).travelers,0);
      slots=[{
        startsAt:new Date(b.starts_at).toISOString(),
        endsAt:new Date(b.ends_at).toISOString(),
        time:localTime,
        available:new Date(b.starts_at).getTime()>=Date.now()&&used<capacity,
        remaining:Math.max(0,capacity-used)
      }];
    }else{
      slots=slotList(b,aps as any[],durationMinutes);
    }
    return {
      id:String(b.id),date,startsAt:new Date(b.starts_at).toISOString(),endsAt:new Date(b.ends_at).toISOString(),
      location:{id:String(b.location_id),name:b.location_name||'',address:b.address||'',city:b.city||'',state:b.state||'',country:b.country||'',room:b.room||''},
      slots
    };
  }).filter(Boolean);
  const initials=String(p.full_name||'T').replace(/^(Dr\.?|Dra\.?)\s*/i,'').split(/\s+/).slice(0,2).map((x:string)=>x[0]||'').join('').toUpperCase();
  const media=parseProviderMedia(p.bio);

  return NextResponse.json({
    provider:{
      slug:p.public_slug,name:p.full_name,initials,category:p.provider_category||'Otro',activity:p.provider_activity||p.specialty||'Servicio',
      type:p.provider_type||'Profesional independiente',phone:p.phone||'',specialty:p.specialty||'',profileImage:media.profileImage||'',workImages:media.workImages||[],licenseNumber:media.licenseNumber||'',credentialStatus:media.credentialStatus||'NONE',
      location:[p.location_name,p.address,p.city,p.state,p.country].filter(Boolean).join(' · '),
      country:p.country||'',
      dayStatus:(statusRows[0] as any)?.status||'NORMAL',delayMinutes:Number((statusRows[0] as any)?.delay_minutes||0)
    },
    services:services.map((s:any)=>{
      const travel=travelServiceFields(s.description);
      const visual=parseServiceMedia(s.description);
      return {
        id:String(s.id),name:s.name,
        description:travelMode?travel.details:visual.details,
        serviceImage:travelMode?'':visual.image,
        summary:travel.summary,travelImage:travelMode?travel.image:'',travelDate:travel.travelDate,departureTime:travel.departureTime,returnTime:travel.returnTime,locationId:travel.locationId,capacity:travel.capacity,childPrice:travel.childPrice,
        durationMinutes:Number(s.duration_minutes),price:Number(s.price),currency:s.currency||'USD'
      };
    }),
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
  if(!commercial||!subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Esta agenda está temporalmente fuera de servicio.'},{status:403});
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

  const serviceRows=await sql`SELECT id,name,description,duration_minutes,price,currency FROM provider_services WHERE id=${body.serviceId}::uuid AND doctor_id=${p.id} AND active=true LIMIT 1`;
  const service=serviceRows[0] as any;
  if(!service) return NextResponse.json({error:'Servicio no disponible'},{status:404});

  const duration=Math.max(5,Number(service.duration_minutes||30));
  const requestedStart=new Date(startsAt);
  if(Number.isNaN(requestedStart.getTime())) return NextResponse.json({error:'Horario inválido'},{status:400});
  const serviceTravel=travelServiceFields(service.description||'');
  const travelModeBooking=isTravelProvider(p.provider_category,p.provider_activity);
  const travelAdults=travelModeBooking?Math.max(1,Math.min(100,Math.floor(Number(body.travelAdults||1)))):1;
  const travelChildren=travelModeBooking?Math.max(0,Math.min(100,Math.floor(Number(body.travelChildren||0)))):0;
  const travelers=travelAdults+travelChildren;
  if(travelModeBooking&&travelers>Math.max(1,Number(serviceTravel.capacity||1)))return NextResponse.json({error:'La cantidad de viajeros supera los cupos de este viaje.'},{status:400});
  const childUnitPrice=serviceTravel.childPrice===null||serviceTravel.childPrice===undefined?Number(service.price||0):Number(serviceTravel.childPrice||0);
  const bookingTotal=travelModeBooking?(travelAdults*Number(service.price||0)+travelChildren*childUnitPrice):Number(service.price||0);
  const bookingReason=travelModeBooking?serializeTravelParty({adults:travelAdults,children:travelChildren,note:String(body.note||'')}):String(body.note||'')||null;
  if(travelModeBooking&&serviceTravel.travelDate){
    const localDate=requestedStart.toLocaleDateString('en-CA',{timeZone:'America/Caracas'});
    if(localDate!==serviceTravel.travelDate)return NextResponse.json({error:'Ese viaje solo puede reservarse en la fecha indicada en su tarjeta.'},{status:409});
    if(serviceTravel.departureTime){
      const localTime=requestedStart.toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
      if(localTime!==serviceTravel.departureTime)return NextResponse.json({error:'Selecciona la hora de salida indicada para este viaje.'},{status:409});
    }
    if(serviceTravel.locationId&&String(body.locationId||'')!==serviceTravel.locationId)return NextResponse.json({error:'Selecciona el punto de salida indicado para este viaje.'},{status:409});
  }
  const requestedEnd=new Date(requestedStart.getTime()+duration*60000);

  // La hora debe haber sido generada por el motor automático de disponibilidad.
  // El cliente no puede inventar una hora intermedia distinta a la secuencia
  // calculada por la duración real de los servicios y las reservas existentes.
  const requestedLocationId=String(body.locationId||'');
  if(!requestedLocationId) return NextResponse.json({error:'Selecciona la ubicación de tu cita.'},{status:400});

  const matchingBlocks=await sql`SELECT id,starts_at,ends_at
    FROM availability_blocks
    WHERE doctor_id=${p.id}
      AND location_id=${requestedLocationId}::uuid
      AND published=true
      AND starts_at<=${requestedStart.toISOString()}::timestamptz
      AND ends_at>=${requestedEnd.toISOString()}::timestamptz`;

  if(!matchingBlocks.length) return NextResponse.json({error:'Ese horario no pertenece a una disponibilidad publicada.'},{status:409});

  const currentAppointments=await sql`SELECT starts_at,ends_at,status
    FROM appointments
    WHERE doctor_id=${p.id}
      AND ends_at>=${new Date(Math.min(...(matchingBlocks as any[]).map(b=>new Date(b.starts_at).getTime()))).toISOString()}::timestamptz
      AND starts_at<=${new Date(Math.max(...(matchingBlocks as any[]).map(b=>new Date(b.ends_at).getTime()))).toISOString()}::timestamptz`;

  const validStart=(matchingBlocks as any[]).some(block=>
    slotList(block,currentAppointments as any[],duration).some((slot:any)=>slot.startsAt===requestedStart.toISOString())
  );
  if(!validStart) return NextResponse.json({error:'Ese inicio ya no corresponde a la secuencia disponible. Actualiza los horarios y elige la nueva hora.'},{status:409});

  let patientRows=await sql`SELECT id FROM patients WHERE lower(email)=lower(${email}) OR phone=${phone} ORDER BY created_at DESC LIMIT 1`;
  let patientId=(patientRows[0] as any)?.id;
  if(patientId){
    await sql`UPDATE patients SET full_name=${clientName},phone=${phone},email=${email},national_id=COALESCE(${String(body.nationalId||'')||null},national_id) WHERE id=${patientId}`;
  }else{
    const rows=await sql`INSERT INTO patients(full_name,national_id,phone,email) VALUES(${clientName},${String(body.nationalId||'')||null},${phone},${email}) RETURNING id`;
    patientId=(rows[0] as any)?.id;
  }

  // Las citas normales bloquean solapamientos. Viajes permite varios clientes
  // en la misma salida hasta completar los cupos configurados.
  let rows:any[]=[];
  if(isTravelProvider(p.provider_category,p.provider_activity)){
    const capacity=Math.max(1,Number(serviceTravel.capacity||1));
    rows=await sql`
      WITH trip_lock AS (
        SELECT pg_advisory_xact_lock(hashtext(${String(service.id)})::bigint)
      ),
      valid_block AS (
        SELECT ab.id,ab.location_id,l.name,l.address,l.city,l.state,l.country,dl.room
        FROM availability_blocks ab
        JOIN locations l ON l.id=ab.location_id
        LEFT JOIN doctor_locations dl ON dl.doctor_id=ab.doctor_id AND dl.location_id=ab.location_id,
        trip_lock
        WHERE ab.doctor_id=${p.id}
          AND ab.location_id=${requestedLocationId}::uuid
          AND ab.published=true
          AND ab.starts_at=${requestedStart.toISOString()}::timestamptz
          AND ab.ends_at>=${requestedEnd.toISOString()}::timestamptz
        LIMIT 1
      ),
      capacity_ok AS (
        SELECT vb.*
        FROM valid_block vb
        WHERE COALESCE((
          SELECT sum(
            CASE
              WHEN a.reason_short LIKE 'TUCITA_TRAVEL_PARTY_V1|%'
                THEN COALESCE(NULLIF(substring(a.reason_short from 'T=([0-9]+)'),'')::int,1)
              ELSE 1
            END
          )
          FROM appointments a
          WHERE a.service_id=${service.id}
            AND a.starts_at=${requestedStart.toISOString()}::timestamptz
            AND a.status NOT IN ('CANCELLED','PAYMENT_REJECTED')
        ),0) + ${travelers} <= ${capacity}
      ),
      inserted AS (
        INSERT INTO appointments(doctor_id,patient_id,location_id,starts_at,ends_at,status,source,reason_short,service_id,service_name,consultation_price,consultation_currency,payment_method,payment_reference,payment_proof_url,payment_submitted_at,reschedule_used,policy_accepted,checkin_token,receipt_number,location_name_snapshot,location_address_snapshot,location_city_snapshot,location_state_snapshot,location_country_snapshot,location_room_snapshot)
        SELECT ${p.id},${patientId},vb.location_id,${requestedStart.toISOString()}::timestamptz,${requestedEnd.toISOString()}::timestamptz,${initialStatus}::appointment_status,'PATIENT_WEB',${bookingReason},${service.id},${service.name},${bookingTotal},${service.currency||'USD'},${paymentMethod},${reference||null},${proof||null},now(),false,true,${randomUUID()},${'TC-'+new Date().getFullYear()+'-'+randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()},vb.name,vb.address,vb.city,vb.state,vb.country,vb.room
        FROM capacity_ok vb
        RETURNING id,checkin_token
      )
      SELECT id,checkin_token FROM inserted`;
  }else{
    rows=await sql`
      WITH provider_lock AS (
        SELECT pg_advisory_xact_lock(hashtext(${String(p.id)})::bigint)
      ),
      valid_block AS (
        SELECT ab.id,ab.location_id,l.name,l.address,l.city,l.state,l.country,dl.room
        FROM availability_blocks ab
        JOIN locations l ON l.id=ab.location_id
        LEFT JOIN doctor_locations dl ON dl.doctor_id=ab.doctor_id AND dl.location_id=ab.location_id,
        provider_lock
        WHERE ab.doctor_id=${p.id}
          AND ab.location_id=${requestedLocationId}::uuid
          AND ab.published=true
          AND ab.starts_at<=${requestedStart.toISOString()}::timestamptz
          AND ab.ends_at>=${requestedEnd.toISOString()}::timestamptz
        LIMIT 1
      ),
      inserted AS (
        INSERT INTO appointments(doctor_id,patient_id,location_id,starts_at,ends_at,status,source,reason_short,service_id,service_name,consultation_price,consultation_currency,payment_method,payment_reference,payment_proof_url,payment_submitted_at,reschedule_used,policy_accepted,checkin_token,receipt_number,location_name_snapshot,location_address_snapshot,location_city_snapshot,location_state_snapshot,location_country_snapshot,location_room_snapshot)
        SELECT ${p.id},${patientId},vb.location_id,${requestedStart.toISOString()}::timestamptz,${requestedEnd.toISOString()}::timestamptz,${initialStatus}::appointment_status,'PATIENT_WEB',${String(body.note||'')||null},${service.id},${service.name},${Number(service.price||0)},${service.currency||'USD'},${paymentMethod},${reference||null},${proof||null},now(),false,true,${randomUUID()},${'TC-'+new Date().getFullYear()+'-'+randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()},vb.name,vb.address,vb.city,vb.state,vb.country,vb.room
        FROM valid_block vb
        WHERE NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_id=${p.id}
            AND a.status NOT IN ('CANCELLED','PAYMENT_REJECTED')
            AND a.starts_at<${requestedEnd.toISOString()}::timestamptz
            AND a.ends_at>${requestedStart.toISOString()}::timestamptz
        )
        RETURNING id,checkin_token
      )
      SELECT id,checkin_token FROM inserted`;
  }

  if(!rows.length) return NextResponse.json({error:isTravelProvider(p.provider_category,p.provider_activity)?'Este viaje ya completó sus cupos o la salida cambió. Actualiza la página.':'Ese horario ya no está disponible o acaba de ser reservado. Elige otro.'},{status:409});
  const appointmentId=String((rows[0] as any)?.id);
  const receiptToken=String((rows[0] as any)?.checkin_token||'');
  const when=requestedStart.toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'});
  let customerMail:any={ok:false};
  if(initialStatus==='CONFIRMED'){
    const receipt=await buildAppointmentReceiptPdf(appointmentId);
    const loc=[receipt.data.locationName,receipt.data.address,receipt.data.room].filter(Boolean).join(' · ');
    customerMail=await sendTransactionalEmail({to:email,subject:'Tu reserva TUCITA fue confirmada',html:tucitaEmail('Reserva confirmada',`<p>Hola <strong>${clientName}</strong>.</p><p>Tu reserva quedó confirmada.</p><p><strong>Servicio:</strong> ${service.name}<br/>${travelModeBooking?'<strong>Viajeros:</strong> '+travelAdults+' adulto'+(travelAdults===1?'':'s')+(travelChildren?' + '+travelChildren+' niño'+(travelChildren===1?'':'s'):'')+'<br/><strong>Total:</strong> '+(service.currency||'USD')+' '+bookingTotal.toFixed(2)+'<br/>':''}<strong>Con:</strong> ${p.full_name}<br/><strong>Fecha y hora:</strong> ${when}<br/><strong>Lugar:</strong> ${loc||'Por confirmar'}</p><p>Adjuntamos tu recibo TUCITA con el código QR que debes presentar al llegar.</p>`),attachments:[{filename:String(receipt.data.receipt_number||'recibo-tucita')+'.pdf',content:receipt.buffer.toString('base64')}]});
  }else{
    customerMail=await sendTransactionalEmail({to:email,subject:'Recibimos tu reserva TUCITA',html:tucitaEmail('Reserva preagendada',`<p>Hola <strong>${clientName}</strong>.</p><p>Recibimos tu reserva y comprobante. El profesional o negocio revisará el pago antes de confirmarla.</p><p><strong>Servicio:</strong> ${service.name}<br/>${travelModeBooking?'<strong>Viajeros:</strong> '+travelAdults+' adulto'+(travelAdults===1?'':'s')+(travelChildren?' + '+travelChildren+' niño'+(travelChildren===1?'':'s'):'')+'<br/><strong>Total:</strong> '+(service.currency||'USD')+' '+bookingTotal.toFixed(2)+'<br/>':''}<strong>Con:</strong> ${p.full_name}<br/><strong>Fecha y hora:</strong> ${when}</p><p>Cuando el pago sea aprobado recibirás por correo tu recibo PDF con el código QR de la cita.</p>`)});
  }
  const providerEmail=String(p.organization_email||p.email||'').trim();
  if(providerEmail){
    await sendTransactionalEmail({to:providerEmail,subject:'Nueva reserva en TUCITA',html:tucitaEmail('Nueva reserva recibida',`<p><strong>${clientName}</strong> reservó <strong>${service.name}</strong> con ${p.full_name}.</p><p><strong>Fecha y hora:</strong> ${when}<br/><strong>Monto:</strong> ${service.currency||'USD'} ${bookingTotal.toFixed(2)}${travelModeBooking?'<br/><strong>Viajeros:</strong> '+travelAdults+' adulto'+(travelAdults===1?'':'s')+(travelChildren?' + '+travelChildren+' niño'+(travelChildren===1?'':'s'):''):''}<br/><strong>Estado:</strong> ${initialStatus==='CONFIRMED'?'Confirmada':'Pago por revisar'}</p><p><a href="${process.env.APP_URL||'https://tucita.com.ve'}/panel">Abrir TUCITA</a></p>`)});
  }
  return NextResponse.json({ok:true,appointmentId,receiptToken,status:initialStatus,emailNotice:customerMail.ok?'sent':'pending'},{status:201});
}
