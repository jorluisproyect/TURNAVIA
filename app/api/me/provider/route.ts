import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';
import { refreshCommercialClientByEmail, subscriptionAllowed } from '@/lib/subscription';
import { buildAppointmentReceiptPdf } from '@/lib/appointment-receipt';
import { parseProviderMedia, serializeProviderMedia, validateProviderMedia } from '@/lib/provider-media';
import { validatePhone } from '@/lib/phone';
import { normalizedBirthDate, normalizedDocument, dateForInput } from '@/lib/personal-profile';
import { isTravelProvider, serializeTravelServiceDescription, travelServiceFields, validateTravelServiceMeta, travelPartyFromReason } from '@/lib/travel-service';
import { parseServiceMedia, serializeServiceMedia, validateServiceMedia } from '@/lib/service-media';
import { prohibitedMarketplaceReason } from '@/lib/compliance';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function travelWindow(date:string,time:string,durationMinutes:number){
  const startsAt=new Date(`${date}T${time}:00-04:00`);
  const endsAt=new Date(startsAt.getTime()+Math.max(5,durationMinutes)*60000);
  return {startsAt,endsAt};
}

async function ensureTravelInternalLocation(provider:any){
  if(!sql)throw new Error('Base de datos no disponible.');
  const existing=await sql`
    SELECT l.id
    FROM doctor_locations dl
    JOIN locations l ON l.id=dl.location_id
    WHERE dl.doctor_id=${provider.doctor_id}
      AND l.active=false
      AND l.name='Viaje / Tour'
    ORDER BY l.created_at
    LIMIT 1`;
  if(existing.length)return String((existing[0] as any).id);

  const created=await sql`
    INSERT INTO locations(organization_id,name,address,city,state,country,active)
    VALUES(${provider.organization_id||null},'Viaje / Tour',NULL,NULL,NULL,NULL,false)
    RETURNING id`;
  const id=String((created[0] as any).id);
  await sql`INSERT INTO doctor_locations(doctor_id,location_id,room)
    VALUES(${provider.doctor_id},${id}::uuid,NULL)
    ON CONFLICT DO NOTHING`;
  return id;
}

async function syncTravelAvailability(doctorId:string,previous:any,next:any,durationMinutes:number){
  if(!sql)return;
  const locationId=String(next.locationId||'');
  if(!locationId)throw new Error('No se pudo preparar internamente la salida del viaje.');
  const owned=await sql`SELECT 1 FROM doctor_locations WHERE doctor_id=${doctorId} AND location_id=${locationId}::uuid LIMIT 1`;
  if(!owned.length)throw new Error('No se pudo preparar internamente la salida del viaje.');

  if(previous?.travelDate&&previous?.departureTime&&previous?.locationId){
    const old=travelWindow(previous.travelDate,previous.departureTime,Number(previous.durationMinutes||durationMinutes));
    await sql`DELETE FROM availability_blocks
      WHERE doctor_id=${doctorId}
        AND location_id=${String(previous.locationId)}::uuid
        AND starts_at=${old.startsAt.toISOString()}::timestamptz
        AND NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.doctor_id=${doctorId}
            AND a.starts_at=availability_blocks.starts_at
            AND a.status NOT IN ('CANCELLED','PAYMENT_REJECTED')
        )`;
  }

  const win=travelWindow(next.travelDate,next.departureTime,durationMinutes);
  await sql`INSERT INTO availability_blocks(doctor_id,location_id,starts_at,ends_at,slot_minutes,max_patients,published)
    SELECT ${doctorId},${locationId}::uuid,${win.startsAt.toISOString()}::timestamptz,${win.endsAt.toISOString()}::timestamptz,5,${Math.max(1,Number(next.capacity||1))},true
    WHERE NOT EXISTS (
      SELECT 1 FROM availability_blocks
      WHERE doctor_id=${doctorId}
        AND location_id=${locationId}::uuid
        AND starts_at=${win.startsAt.toISOString()}::timestamptz
        AND ends_at=${win.endsAt.toISOString()}::timestamptz
    )`;
  await sql`UPDATE availability_blocks SET max_patients=${Math.max(1,Number(next.capacity||1))},published=true
    WHERE doctor_id=${doctorId}
      AND location_id=${locationId}::uuid
      AND starts_at=${win.startsAt.toISOString()}::timestamptz
      AND ends_at=${win.endsAt.toISOString()}::timestamptz`;
}

async function currentProvider(){
  if(!sql) return null;
  const {data:session}=await auth.getSession();
  if(!session?.user) return null;
  const email=String((session.user as any).email||'').toLowerCase();
  const rows=await sql`SELECT d.id AS doctor_id,d.public_slug,d.specialty,d.provider_category,d.provider_activity,d.provider_type,
      d.consultation_price,d.consultation_currency,d.payment_instructions,d.default_appointment_minutes,d.accepts_online_booking,d.bio,
      u.id AS user_id,u.full_name,u.email,u.phone,u.organization_id,
      o.slug AS organization_slug,o.name AS organization_name,
      l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room,
      c.id AS commercial_client_id,c.status AS subscription_status,c.trial_ends_at,c.payment_reviewed_at
    FROM users u
    JOIN doctors d ON d.user_id=u.id
    LEFT JOIN organizations o ON o.id=u.organization_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
      AND EXISTS (SELECT 1 FROM locations lx WHERE lx.id=dl.location_id AND lx.active=true)
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
    LEFT JOIN commercial_clients c ON lower(c.email)=lower(u.email)
    WHERE lower(u.email)=lower(${email})
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT 1`;
  return rows[0] as any || null;
}

export async function GET(){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const provider=await currentProvider();
  if(!provider) return NextResponse.json({error:'Cuenta profesional no encontrada'},{status:404});
  const commercial=await refreshCommercialClientByEmail(String(provider.email||''));
  if(commercial && !subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Tu prueba o mensualidad requiere activación.',paymentRequired:true,clientId:String(commercial.id),status:commercial.status},{status:402});

  const services=await sql`SELECT id,name,description,duration_minutes,price,currency,active
    FROM provider_services WHERE doctor_id=${provider.doctor_id} ORDER BY active DESC,created_at`;
  const locations=await sql`SELECT l.id,l.name,l.address,l.city,l.state,l.country,dl.room
    FROM doctor_locations dl JOIN locations l ON l.id=dl.location_id
    WHERE dl.doctor_id=${provider.doctor_id} AND l.active=true ORDER BY l.created_at,l.name`;
  const availability=await sql`SELECT ab.id,ab.starts_at,ab.ends_at,ab.slot_minutes,ab.published,
      l.id AS location_id,l.name AS location_name,l.address,l.city,l.state,l.country,dl.room
    FROM availability_blocks ab
    JOIN locations l ON l.id=ab.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=ab.doctor_id AND dl.location_id=ab.location_id
    WHERE ab.doctor_id=${provider.doctor_id} AND ab.starts_at>=now()-interval '1 day'
    ORDER BY ab.starts_at LIMIT 120`;
  const appointments=await sql`SELECT a.id,a.starts_at,a.ends_at,a.status,a.service_name,a.consultation_price,a.consultation_currency,
      a.payment_method,a.payment_reference,a.payment_proof_url,a.payment_submitted_at,a.payment_approved_at,a.reschedule_used,a.reason_short,
      a.receipt_number,a.checked_in_at,a.completed_at,
      COALESCE(a.location_name_snapshot,l.name) AS location_name,
      COALESCE(a.location_address_snapshot,l.address) AS location_address,
      COALESCE(a.location_city_snapshot,l.city) AS location_city,
      COALESCE(a.location_state_snapshot,l.state) AS location_state,
      COALESCE(a.location_country_snapshot,l.country) AS location_country,
      COALESCE(a.location_room_snapshot,dl.room) AS location_room,
      p.full_name AS client_name,p.phone AS client_phone,p.email AS client_email
    FROM appointments a JOIN patients p ON p.id=a.patient_id
    LEFT JOIN locations l ON l.id=a.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=a.doctor_id AND dl.location_id=a.location_id
    WHERE a.doctor_id=${provider.doctor_id}
    ORDER BY a.starts_at DESC LIMIT 100`;
  const statusRows=await sql`SELECT status,delay_minutes,note,updated_at FROM doctor_status_updates
    WHERE doctor_id=${provider.doctor_id} ORDER BY updated_at DESC LIMIT 1`;

  const media=parseProviderMedia(provider.bio);
  const privateRows=await sql`SELECT
    (SELECT to_jsonb(ap)->>'national_id' FROM app_user_profiles ap WHERE lower(ap.email)=lower(${String(provider.email||'')}) ORDER BY ap.updated_at DESC LIMIT 1) AS national_id,
    (SELECT to_jsonb(ap)->>'birth_date' FROM app_user_profiles ap WHERE lower(ap.email)=lower(${String(provider.email||'')}) ORDER BY ap.updated_at DESC LIMIT 1) AS birth_date,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='app_user_profiles' AND column_name IN ('national_id','birth_date')) AS private_columns`;
  const privateProfile=privateRows[0] as any;
  return NextResponse.json({
    provider:{
      id:String(provider.doctor_id),slug:provider.public_slug,name:provider.full_name,email:provider.email||'',phone:provider.phone||'',profileImage:media.profileImage||'',workImages:media.workImages||[],licenseNumber:media.licenseNumber||'',
      nationalId:String(privateProfile?.national_id||''),birthDate:dateForInput(privateProfile?.birth_date),personalFieldsReady:Number(privateProfile?.private_columns||0)===2,
      organizationSlug:provider.organization_slug||'',organizationName:provider.organization_name||'',
      publicPath:provider.organization_slug?'/negocio/'+provider.organization_slug:'/reservar/'+provider.public_slug,
      category:provider.provider_category||'Salud',activity:provider.provider_activity||provider.specialty||'Servicio',
      type:provider.provider_type||'Profesional independiente',specialty:provider.specialty||'',
      price:Number(provider.consultation_price||0),currency:provider.consultation_currency||'USD',
      paymentInstructions:provider.payment_instructions||'',defaultMinutes:Number(provider.default_appointment_minutes||30),
      acceptsOnlineBooking:Boolean(provider.accepts_online_booking),
      location:{id:provider.location_id?String(provider.location_id):'',name:provider.location_name||'',address:provider.address||'',city:provider.city||'',state:provider.state||'',country:provider.country||'Venezuela',room:provider.room||''},
      subscriptionStatus:provider.subscription_status||'TRIAL',clientId:provider.commercial_client_id?String(provider.commercial_client_id):'',trialEndsAt:provider.trial_ends_at?new Date(provider.trial_ends_at).toISOString():null,renewalDueAt:provider.payment_reviewed_at?new Date(new Date(provider.payment_reviewed_at).getTime()+31*86400000).toISOString():null,
      dayStatus:(statusRows[0] as any)?.status||'NORMAL',delayMinutes:Number((statusRows[0] as any)?.delay_minutes||0)
    },
    services:services.map((s:any)=>{
      const travelMode=isTravelProvider(provider.provider_category,provider.provider_activity);
      const travel=travelServiceFields(s.description);
      const visual=parseServiceMedia(s.description);
      return {
        id:String(s.id),name:s.name,
        description:travelMode?travel.details:visual.details,
        serviceImage:travelMode?'':visual.image,
        durationMinutes:Number(s.duration_minutes),price:Number(s.price),currency:s.currency,active:Boolean(s.active),
        summary:travel.summary,travelImage:travelMode?travel.image:'',travelDate:travel.travelDate,departureTime:travel.departureTime,returnTime:travel.returnTime,locationId:travel.locationId,capacity:travel.capacity,childPrice:travel.childPrice
      };
    }),
    locations:locations.map((l:any)=>({id:String(l.id),name:l.name,address:l.address||'',city:l.city||'',state:l.state||'',country:l.country||'',room:l.room||''})),
    availability:availability.map((a:any)=>({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),slotMinutes:Number(a.slot_minutes),published:Boolean(a.published),location:{id:String(a.location_id),name:a.location_name||'',address:a.address||'',city:a.city||'',state:a.state||'',country:a.country||'',room:a.room||''}})),
    appointments:appointments.map((a:any)=>{const party=travelPartyFromReason(a.reason_short);return ({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),status:a.status,serviceName:a.service_name||'Servicio',price:Number(a.consultation_price||0),currency:a.consultation_currency||'USD',paymentMethod:a.payment_method||'',paymentReference:a.payment_reference||'',paymentProofUrl:a.payment_proof_url||'',paymentSubmittedAt:a.payment_submitted_at?new Date(a.payment_submitted_at).toISOString():null,paymentApprovedAt:a.payment_approved_at?new Date(a.payment_approved_at).toISOString():null,rescheduleUsed:Boolean(a.reschedule_used),receiptNumber:a.receipt_number||'',checkedInAt:a.checked_in_at?new Date(a.checked_in_at).toISOString():null,completedAt:a.completed_at?new Date(a.completed_at).toISOString():null,location:{name:a.location_name||'',address:a.location_address||'',city:a.location_city||'',state:a.location_state||'',country:a.location_country||'',room:a.location_room||''},clientName:a.client_name,clientPhone:a.client_phone,clientEmail:a.client_email||'',travelAdults:party.adults,travelChildren:party.children,travelers:party.travelers,note:party.note})})
  });
}

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const provider=await currentProvider();
  if(!provider) return NextResponse.json({error:'No autorizado'},{status:401});
  const commercial=await refreshCommercialClientByEmail(String(provider.email||''));
  if(commercial && !subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)) return NextResponse.json({error:'Tu prueba o mensualidad requiere activación.',paymentRequired:true,clientId:String(commercial.id),status:commercial.status},{status:402});
  const body=await req.json();
  const action=String(body.action||'');

  if(action==='profile'){
    const mediaError=validateProviderMedia(String(body.profileImage||''),Array.isArray(body.workImages)?body.workImages:[]);
    if(mediaError)return NextResponse.json({error:mediaError},{status:400});
    const name=String(body.name||provider.full_name).trim();
    const phoneResult=validatePhone(String(body.phoneCountry||''),String(body.phoneLocal||''));
    const phone=phoneResult.phone;
    const national=normalizedDocument(body.nationalId);
    const birth=normalizedBirthDate(body.birthDate);
    if(!name)return NextResponse.json({error:'Escribe tu nombre.'},{status:400});
    if(phoneResult.error)return NextResponse.json({error:phoneResult.error},{status:400});
    if(national.error)return NextResponse.json({error:national.error},{status:400});
    if(birth.error)return NextResponse.json({error:birth.error},{status:400});
    const available=await sql`SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='app_user_profiles' AND column_name IN ('national_id','birth_date')`;
    const detailsReady=Number((available[0] as any)?.n||0)===2;
    if(!detailsReady&&(national.value||birth.value))return NextResponse.json({error:'La base de datos de perfiles está pendiente de actualización. Intenta de nuevo cuando se habiliten los datos personales.'},{status:503});
    const category=String(body.category||provider.provider_category||'Otro').trim();
    const activity=String(body.activity||provider.provider_activity||'Servicio').trim();
    const type=String(body.type||provider.provider_type||'Profesional independiente').trim();
    const email=String(provider.email||'').toLowerCase();
    const profileProhibited=prohibitedMarketplaceReason(category,activity,name);
    if(profileProhibited)return NextResponse.json({error:profileProhibited},{status:400});
    await sql`UPDATE users SET full_name=${name},phone=${phone} WHERE id=${provider.user_id}`;
    await sql`UPDATE app_user_profiles SET full_name=${name},phone=${phone},updated_at=now() WHERE lower(email)=lower(${email})`;
    if(detailsReady){
      await sql`UPDATE app_user_profiles SET national_id=${national.value||null},birth_date=${birth.value}::date,updated_at=now() WHERE lower(email)=lower(${email})`;
    }
    const mediaJson=serializeProviderMedia(provider.bio,{profileImage:String(body.profileImage||''),workImages:Array.isArray(body.workImages)?body.workImages:[],licenseNumber:String(body.licenseNumber||'')});
    await sql`UPDATE doctors SET specialty=${activity},provider_category=${category},provider_activity=${activity},provider_type=${type},bio=${mediaJson} WHERE id=${provider.doctor_id}`;
    await sql`UPDATE commercial_clients SET name=${name},phone=${phone},type=${type},category=${category},subcategory=${activity},specialty=${activity} WHERE lower(email)=lower(${email})`;
    if(provider.location_id){
      await sql`UPDATE locations SET name=${String(body.locationName||name+' · ubicación principal')},address=${String(body.address||'')},city=${String(body.city||'')||null},state=${String(body.state||'')||null},country=${String(body.country||'Venezuela')} WHERE id=${provider.location_id}`;
    }
    return NextResponse.json({ok:true});
  }

  if(action==='add_location'){
    const name=String(body.name||'').trim();
    const address=String(body.address||'').trim();
    const city=String(body.city||'').trim();
    const country=String(body.country||'').trim();
    if(!name)return NextResponse.json({error:'Escribe el nombre de la ubicación'},{status:400});
    if(address.length<6)return NextResponse.json({error:'Escribe la dirección exacta donde atenderás.'},{status:400});
    if(!city)return NextResponse.json({error:'Indica la ciudad.'},{status:400});
    if(!country)return NextResponse.json({error:'Indica el país.'},{status:400});
    const rows=await sql`INSERT INTO locations(organization_id,name,address,city,state,country,active)
      VALUES(${provider.organization_id||null},${name},${address},${city},${String(body.state||'')||null},${country},true)
      RETURNING id`;
    const locationId=(rows[0] as any)?.id;
    await sql`INSERT INTO doctor_locations(doctor_id,location_id,room) VALUES(${provider.doctor_id},${locationId},${String(body.room||'')||null}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ok:true,id:String(locationId)});
  }

  if(action==='update_location'){
    const id=String(body.id||'');
    const address=String(body.address||'').trim();
    const city=String(body.city||'').trim();
    const country=String(body.country||'').trim();
    if(address.length<6)return NextResponse.json({error:'Escribe la dirección exacta donde atenderás.'},{status:400});
    if(!city)return NextResponse.json({error:'Indica la ciudad.'},{status:400});
    if(!country)return NextResponse.json({error:'Indica el país.'},{status:400});
    const owned=await sql`SELECT 1 FROM doctor_locations WHERE doctor_id=${provider.doctor_id} AND location_id=${id}::uuid LIMIT 1`;
    if(!owned.length)return NextResponse.json({error:'Ubicación no encontrada'},{status:404});
    await sql`UPDATE locations SET name=${String(body.name||'').trim()},address=${address},city=${city},state=${String(body.state||'')||null},country=${country} WHERE id=${id}::uuid`;
    await sql`UPDATE doctor_locations SET room=${String(body.room||'')||null} WHERE doctor_id=${provider.doctor_id} AND location_id=${id}::uuid`;
    return NextResponse.json({ok:true});
  }

  if(action==='delete_location'){
    const id=String(body.id||'');
    const inUse=await sql`SELECT 1 FROM availability_blocks WHERE doctor_id=${provider.doctor_id} AND location_id=${id}::uuid AND ends_at>=now() LIMIT 1`;
    if(inUse.length)return NextResponse.json({error:'Esta ubicación tiene horarios futuros. Elimina o mueve esos horarios primero.'},{status:409});
    await sql`DELETE FROM doctor_locations WHERE doctor_id=${provider.doctor_id} AND location_id=${id}::uuid`;
    return NextResponse.json({ok:true});
  }

  if(action==='settings'){
    await sql`UPDATE doctors SET consultation_price=${Number(body.price||0)},consultation_currency=${String(body.currency||'USD')},payment_instructions=${String(body.paymentInstructions||'')},default_appointment_minutes=${Math.max(5,Number(body.defaultMinutes||30))},accepts_online_booking=${body.acceptsOnlineBooking!==false} WHERE id=${provider.doctor_id}`;
    return NextResponse.json({ok:true});
  }

  if(action==='add_service'){
    const name=String(body.name||'').trim();
    if(!name) return NextResponse.json({error:'Escribe el nombre del servicio'},{status:400});
    const prohibited=prohibitedMarketplaceReason(name,String(body.description||''),String(body.summary||''));
    if(prohibited)return NextResponse.json({error:prohibited},{status:400});
    const travelMode=isTravelProvider(provider.provider_category,provider.provider_activity);
    let description=String(body.description||'');
    if(travelMode){
      const internalLocationId=await ensureTravelInternalLocation(provider);
      const meta={summary:String(body.summary||''),details:description,image:String(body.travelImage||''),travelDate:String(body.travelDate||''),departureTime:String(body.departureTime||''),returnTime:String(body.returnTime||''),locationId:internalLocationId,capacity:Math.max(1,Number(body.capacity||1)),childPrice:body.childPrice===''||body.childPrice===null||body.childPrice===undefined?null:Math.max(0,Number(body.childPrice||0))};
      const issue=validateTravelServiceMeta(meta);
      if(issue)return NextResponse.json({error:issue},{status:400});
      if(!meta.summary.trim()||!meta.travelDate||!meta.departureTime)return NextResponse.json({error:'En Viajes completa descripción corta, fecha y hora de salida.'},{status:400});
      description=serializeTravelServiceDescription(meta);
    }else{
      const meta={details:description,image:String(body.serviceImage||'')};
      const issue=validateServiceMedia(meta);
      if(issue)return NextResponse.json({error:issue},{status:400});
      description=serializeServiceMedia(meta);
    }
    const rows=await sql`INSERT INTO provider_services(doctor_id,name,description,duration_minutes,price,currency,active)
      VALUES(${provider.doctor_id},${name},${description||null},${Math.max(5,Number(body.durationMinutes||30))},${Math.max(0,Number(body.price||0))},${String(body.currency||'USD')},true)
      RETURNING id`;
    if(travelMode){
      try{await syncTravelAvailability(String(provider.doctor_id),null,travelServiceFields(description),Math.max(5,Number(body.durationMinutes||30)));}
      catch(error:any){await sql`DELETE FROM provider_services WHERE id=${(rows[0] as any)?.id}::uuid AND doctor_id=${provider.doctor_id}`;return NextResponse.json({error:String(error?.message||'No se pudo crear la salida del viaje.')},{status:400});}
    }
    return NextResponse.json({ok:true,id:String((rows[0] as any)?.id)});
  }

  if(action==='update_service'){
    const prohibited=prohibitedMarketplaceReason(String(body.name||''),String(body.description||''),String(body.summary||''));
    if(prohibited)return NextResponse.json({error:prohibited},{status:400});
    const travelMode=isTravelProvider(provider.provider_category,provider.provider_activity);
    let descriptionValue:any=body.description??null;
    const hasTravelPayload=['summary','travelImage','travelDate','departureTime','returnTime'].some(k=>Object.prototype.hasOwnProperty.call(body,k));
    if(!travelMode&&(Object.prototype.hasOwnProperty.call(body,'description')||Object.prototype.hasOwnProperty.call(body,'serviceImage'))){
      const current=await sql`SELECT description FROM provider_services WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id} LIMIT 1`;
      const previous=parseServiceMedia((current[0] as any)?.description||'');
      const meta={
        details:Object.prototype.hasOwnProperty.call(body,'description')?String(body.description||''):previous.details,
        image:Object.prototype.hasOwnProperty.call(body,'serviceImage')?String(body.serviceImage||''):previous.image
      };
      const issue=validateServiceMedia(meta);
      if(issue)return NextResponse.json({error:issue},{status:400});
      descriptionValue=serializeServiceMedia(meta);
    }
    if(travelMode&&(hasTravelPayload||Object.prototype.hasOwnProperty.call(body,'description'))){
      const current=await sql`SELECT description FROM provider_services WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id} LIMIT 1`;
      const previous=travelServiceFields((current[0] as any)?.description||'');
      const meta={
        summary:Object.prototype.hasOwnProperty.call(body,'summary')?String(body.summary||''):previous.summary,
        details:Object.prototype.hasOwnProperty.call(body,'description')?String(body.description||''):previous.details,
        image:Object.prototype.hasOwnProperty.call(body,'travelImage')?String(body.travelImage||''):previous.image,
        travelDate:Object.prototype.hasOwnProperty.call(body,'travelDate')?String(body.travelDate||''):previous.travelDate,
        departureTime:Object.prototype.hasOwnProperty.call(body,'departureTime')?String(body.departureTime||''):previous.departureTime,
        returnTime:Object.prototype.hasOwnProperty.call(body,'returnTime')?String(body.returnTime||''):previous.returnTime,
        locationId:previous.locationId||await ensureTravelInternalLocation(provider),
        capacity:Object.prototype.hasOwnProperty.call(body,'capacity')?Math.max(1,Number(body.capacity||1)):previous.capacity,
        childPrice:Object.prototype.hasOwnProperty.call(body,'childPrice')?(body.childPrice===''||body.childPrice===null?null:Math.max(0,Number(body.childPrice||0))):previous.childPrice
      };
      const issue=validateTravelServiceMeta(meta);
      if(issue)return NextResponse.json({error:issue},{status:400});
      if(!meta.summary.trim()||!meta.travelDate||!meta.departureTime)return NextResponse.json({error:'En Viajes completa descripción corta, fecha y hora de salida.'},{status:400});
      descriptionValue=serializeTravelServiceDescription(meta);
    }
    let previousTravel:any=null;
    let scheduleChanged=false;
    if(travelMode){
      const current=await sql`SELECT description,duration_minutes FROM provider_services WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id} LIMIT 1`;
      previousTravel={...travelServiceFields((current[0] as any)?.description||''),durationMinutes:Number((current[0] as any)?.duration_minutes||30)};
      const nextTravel=travelServiceFields(String(descriptionValue||''));
      scheduleChanged=previousTravel.travelDate!==nextTravel.travelDate||previousTravel.departureTime!==nextTravel.departureTime||previousTravel.locationId!==nextTravel.locationId||previousTravel.durationMinutes!==Number(body.durationMinutes||previousTravel.durationMinutes);
      if(scheduleChanged){
        const booked=await sql`SELECT count(*)::int AS n FROM appointments WHERE service_id=${body.id}::uuid AND status NOT IN ('CANCELLED','PAYMENT_REJECTED')`;
        if(Number((booked[0] as any)?.n||0)>0)return NextResponse.json({error:'Este viaje ya tiene reservas. Para proteger a los clientes no puedes cambiar fecha, hora, duración o punto de salida. Puedes editar foto, texto, precio o cupos.'},{status:409});
      }
    }
    await sql`UPDATE provider_services SET
      name=COALESCE(${body.name||null},name),
      description=COALESCE(${descriptionValue},description),
      duration_minutes=COALESCE(${body.durationMinutes?Math.max(5,Number(body.durationMinutes)):null},duration_minutes),
      price=COALESCE(${body.price!==undefined?Math.max(0,Number(body.price)):null},price),
      currency=COALESCE(${body.currency||null},currency),
      active=COALESCE(${typeof body.active==='boolean'?body.active:null},active),
      updated_at=now()
      WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
    if(travelMode&&descriptionValue){
      const nextTravel=travelServiceFields(String(descriptionValue));
      try{await syncTravelAvailability(String(provider.doctor_id),scheduleChanged?previousTravel:null,{...nextTravel,capacity:nextTravel.capacity},Number(body.durationMinutes||previousTravel?.durationMinutes||30));}
      catch(error:any){return NextResponse.json({error:String(error?.message||'No se pudo actualizar la salida del viaje.')},{status:400});}
    }
    return NextResponse.json({ok:true});
  }

  if(action==='add_availability'){
    const locationId=String(body.locationId||'');
    if(!locationId)return NextResponse.json({error:'Selecciona dónde atenderás en este horario'},{status:400});
    const owned=await sql`SELECT 1 FROM doctor_locations WHERE doctor_id=${provider.doctor_id} AND location_id=${locationId}::uuid LIMIT 1`;
    if(!owned.length)return NextResponse.json({error:'Ubicación no válida'},{status:400});
    const date=String(body.date||''); const start=String(body.start||''); const end=String(body.end||'');
    if(!date||!start||!end) return NextResponse.json({error:'Completa fecha y horario'},{status:400});
    const startsAt=new Date(`${date}T${start}:00-04:00`);
    const endsAt=new Date(`${date}T${end}:00-04:00`);
    if(Number.isNaN(startsAt.getTime())||Number.isNaN(endsAt.getTime())||endsAt<=startsAt) return NextResponse.json({error:'La hora final debe ser posterior a la hora inicial.'},{status:400});

    const exactDuplicate=await sql`SELECT id FROM availability_blocks
      WHERE doctor_id=${provider.doctor_id}
        AND location_id=${locationId}::uuid
        AND starts_at=${startsAt.toISOString()}::timestamptz
        AND ends_at=${endsAt.toISOString()}::timestamptz
        AND published=true
      LIMIT 1`;
    if(exactDuplicate.length){
      return NextResponse.json({error:'Este bloque de disponibilidad ya está publicado. No puedes agregar el mismo horario dos veces.'},{status:409});
    }

    const overlap=await sql`SELECT ab.id,l.name AS location_name,ab.starts_at,ab.ends_at
      FROM availability_blocks ab
      JOIN locations l ON l.id=ab.location_id
      WHERE ab.doctor_id=${provider.doctor_id}
        AND ab.published=true
        AND ab.starts_at<${endsAt.toISOString()}::timestamptz
        AND ab.ends_at>${startsAt.toISOString()}::timestamptz
      ORDER BY ab.starts_at
      LIMIT 1`;
    if(overlap.length){
      const existing=overlap[0] as any;
      const from=new Date(existing.starts_at).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
      const to=new Date(existing.ends_at).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
      return NextResponse.json({
        error:`Ese horario se cruza con un bloque ya publicado (${from}–${to}${existing.location_name?' · '+existing.location_name:''}). El profesional no puede tener dos bloques al mismo tiempo.`
      },{status:409});
    }

    // slot_minutes se conserva solo por compatibilidad con la tabla existente.
    // La agenda pública ya NO usa un intervalo manual: calcula cada inicio
    // automáticamente con la duración del servicio y el final de la cita previa.
    await sql`INSERT INTO availability_blocks(doctor_id,location_id,starts_at,ends_at,slot_minutes,published)
      VALUES(${provider.doctor_id},${locationId}::uuid,${startsAt.toISOString()}::timestamptz,${endsAt.toISOString()}::timestamptz,5,true)`;
    return NextResponse.json({ok:true});
  }

  if(action==='delete_availability'){
    const rows=await sql`DELETE FROM availability_blocks WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id} RETURNING id`;
    if(!rows.length) return NextResponse.json({error:'Horario no encontrado'},{status:404});
    return NextResponse.json({ok:true});
  }

  if(action==='day_status'){
    await sql`INSERT INTO doctor_status_updates(doctor_id,work_date,status,delay_minutes,note)
      VALUES(${provider.doctor_id},current_date,${String(body.status||'NORMAL')}::doctor_day_status,${Math.max(0,Number(body.delayMinutes||0))},${String(body.note||'')||null})
      ON CONFLICT(doctor_id,work_date) DO UPDATE SET status=EXCLUDED.status,delay_minutes=EXCLUDED.delay_minutes,note=EXCLUDED.note,updated_at=now()`;
    return NextResponse.json({ok:true});
  }

  if(['approve_payment','reject_payment','appointment_status','resend_receipt_email'].includes(action)){
    const rows=await sql`SELECT a.id,a.status,p.email,p.full_name,a.starts_at,a.service_name FROM appointments a JOIN patients p ON p.id=a.patient_id WHERE a.id=${body.id}::uuid AND a.doctor_id=${provider.doctor_id} LIMIT 1`;
    if(!rows.length) return NextResponse.json({error:'Reserva no encontrada'},{status:404});
    let message='Cambios guardados';
    if(action==='resend_receipt_email'){
      const x=rows[0] as any;
      if(!x.email) return NextResponse.json({error:'El cliente no tiene correo registrado.'},{status:409});
      if(!['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(String(x.status))){
        return NextResponse.json({error:'El recibo solo puede enviarse cuando la reserva está confirmada.'},{status:409});
      }
      const when=new Date(x.starts_at).toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'});
      const receipt=await buildAppointmentReceiptPdf(String(x.id));
      const loc=[receipt.data.locationName,receipt.data.address,receipt.data.room].filter(Boolean).join(' · ');
      const mail=await sendTransactionalEmail({
        to:x.email,
        subject:'Tu comprobante y QR de TUCITA',
        html:tucitaEmail('Tu comprobante TUCITA',`<p>Hola <strong>${x.full_name}</strong>.</p><p>Tu reserva está confirmada.</p><p><strong>Servicio:</strong> ${x.service_name||provider.provider_activity}<br/><strong>Con:</strong> ${provider.full_name}<br/><strong>Fecha y hora:</strong> ${when}<br/><strong>Lugar:</strong> ${loc||'Por confirmar'}</p><p>Adjuntamos nuevamente tu comprobante PDF con el código QR que debes presentar al llegar.</p>`),
        attachments:[{filename:String(receipt.data.receipt_number||'recibo-tucita')+'.pdf',content:receipt.buffer.toString('base64')}]
      });
      try{
        await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
          VALUES('APPOINTMENT_RECEIPT_EMAIL_RESEND','APPOINTMENT',${String(x.id)},jsonb_build_object('ok',${Boolean(mail.ok)},'to',${x.email},'error',${mail.error||null}))`;
      }catch{}
      return mail.ok
        ? NextResponse.json({ok:true,message:'Comprobante PDF + QR reenviado al correo del cliente.'})
        : NextResponse.json({error:'No se pudo confirmar el envío del correo. El recibo sigue disponible para descargar.'},{status:502});
    }
    if(action==='approve_payment'){
      await sql`UPDATE appointments SET status='CONFIRMED',payment_approved_at=now() WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
      const x=rows[0] as any;
      if(x.email){
        const when=new Date(x.starts_at).toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'});
        const receipt=await buildAppointmentReceiptPdf(String(x.id));
        const loc=[receipt.data.locationName,receipt.data.address,receipt.data.room].filter(Boolean).join(' · ');
        const mail=await sendTransactionalEmail({to:x.email,subject:'Tu reserva TUCITA fue confirmada',html:tucitaEmail('Reserva confirmada',`<p>Hola <strong>${x.full_name}</strong>.</p><p>Tu pago fue aprobado y tu reserva quedó confirmada.</p><p><strong>Servicio:</strong> ${x.service_name||provider.provider_activity}<br/><strong>Con:</strong> ${provider.full_name}<br/><strong>Fecha y hora:</strong> ${when}<br/><strong>Lugar:</strong> ${loc||'Por confirmar'}</p><p>Adjuntamos tu recibo TUCITA con el código QR que debes presentar al llegar.</p>`),attachments:[{filename:String(receipt.data.receipt_number||'recibo-tucita')+'.pdf',content:receipt.buffer.toString('base64')}]});
        message=mail.ok?'Pago aprobado. Recibo PDF con QR enviado al correo del cliente.':'Pago aprobado. El recibo quedó disponible, pero no pudimos confirmar el envío del correo.';
        try{
          await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
            VALUES('APPOINTMENT_RECEIPT_EMAIL','APPOINTMENT',${String(x.id)},jsonb_build_object('ok',${Boolean(mail.ok)},'to',${x.email},'error',${mail.error||null}))`;
        }catch{}
      }else{
        message='Pago aprobado. La reserva quedó confirmada, pero el cliente no tiene correo registrado.';
      }
    }else if(action==='reject_payment'){
      await sql`UPDATE appointments SET status='PAYMENT_REJECTED' WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
      message='Pago rechazado.';
    }else{
      const allowed=['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED','CANCELLED','NO_SHOW'];
      const next=String(body.status||'');
      if(!allowed.includes(next)) return NextResponse.json({error:'Estado inválido'},{status:400});
      if(next==='ARRIVED'){
        await sql`UPDATE appointments SET status='ARRIVED',checked_in_at=COALESCE(checked_in_at,now()),checked_in_by=COALESCE(checked_in_by,${String(provider.email||'')}) WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
        message='Llegada registrada.';
      }else if(next==='COMPLETED'){
        await sql`UPDATE appointments SET status='COMPLETED',completed_at=COALESCE(completed_at,now()) WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
        message='Servicio completado.';
      }else{
        await sql`UPDATE appointments SET status=${next}::appointment_status WHERE id=${body.id}::uuid AND doctor_id=${provider.doctor_id}`;
      }
    }
    return NextResponse.json({ok:true,message});
  }

  return NextResponse.json({error:'Acción inválida'},{status:400});
}
