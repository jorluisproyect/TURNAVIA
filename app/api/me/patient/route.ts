import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { validateProviderMedia } from '@/lib/provider-media';
import { validatePhone } from '@/lib/phone';
import { normalizedBirthDate, normalizedDocument, dateForInput } from '@/lib/personal-profile';
import { countryFromPhone } from '@/lib/country';
import { parseProviderMedia } from '@/lib/provider-media';

export const dynamic='force-dynamic';

async function currentPatient(){
  if(!sql) return null;
  const {data:session}=await auth.getSession();
  if(!session?.user) return null;
  const authId=String(session.user.id);
  const email=String((session.user as any).email||'').toLowerCase();
  const rows=await sql`SELECT p.id,p.full_name,p.phone,p.email,p.national_id,p.birth_date,p.auth_user_id,u.id AS user_id
    FROM patients p LEFT JOIN users u ON u.id=p.user_id
    WHERE p.auth_user_id=${authId} OR lower(p.email)=lower(${email})
    ORDER BY p.created_at DESC LIMIT 1`;
  return rows[0] as any || null;
}

async function recommendedProviders(country:string){
  if(!sql)return [];
  const rows=await sql`SELECT d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.bio,u.full_name,
      l.city,l.state,l.country
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
    ) cc ON true
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id
    LEFT JOIN locations l ON l.id=dl.location_id AND l.active=true
    WHERE u.active=true
      AND d.accepts_online_booking=true
      AND (${country||null}::text IS NULL OR lower(COALESCE(l.country,''))=lower(${country||null}))
      AND (
        (cc.status IN ('TRIAL','REVISION_BINANCE') AND cc.trial_ends_at IS NOT NULL AND cc.trial_ends_at>now())
        OR (
          cc.status='ACTIVO'
          AND COALESCE(
            (
              SELECT NULLIF(a.metadata->>'paidUntil','')::timestamptz
              FROM audit_events a
              WHERE a.entity_type='COMMERCIAL_CLIENT'
                AND a.entity_id=cc.id::text
                AND a.action='PAYMENT_APPROVED'
              ORDER BY a.created_at DESC LIMIT 1
            ),
            cc.payment_reviewed_at + interval '31 days',
            cc.created_at + interval '31 days'
          )>now()
        )
      )
    ORDER BY u.full_name
    LIMIT 12`;
  const unique=new Map<string,any>();
  for(const row of rows as any[]){
    const slug=String(row.public_slug);
    if(unique.has(slug))continue;
    const media=parseProviderMedia(row.bio);
    unique.set(slug,{
      slug,
      name:row.full_name,
      category:row.provider_category||'Servicio',
      activity:row.provider_activity||'Servicio',
      type:row.provider_type||'',
      city:row.city||'',
      state:row.state||'',
      country:row.country||'',
      profileImage:media.profileImage||''
    });
    if(unique.size>=6)break;
  }
  return [...unique.values()];
}

export async function GET(){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const p=await currentPatient();
  const email=String((session.user as any).email||'');
  const name=String((session.user as any).name||'Cliente');
  const profileRows=await sql`SELECT avatar_data_url,phone FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} OR lower(email)=lower(${email}) ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
  const avatar=String((profileRows[0] as any)?.avatar_data_url||'');

  if(!p){
    const country=countryFromPhone(String((profileRows[0] as any)?.phone||''));
    const recommendations=await recommendedProviders(country);
    return NextResponse.json({patient:{name,email,phone:String((profileRows[0] as any)?.phone||''),country,nationalId:'',birthDate:'',profileImage:avatar},appointments:[],recommendedProviders:recommendations});
  }

  const aps=await sql`SELECT a.id,a.starts_at,a.ends_at,a.status,a.service_id,a.service_name,a.consultation_price,a.consultation_currency,
      a.payment_method,a.payment_reference,a.reschedule_used,a.receipt_number,a.checked_in_at,a.completed_at,
      d.public_slug,d.provider_category,d.provider_activity,u.full_name AS provider_name,
      COALESCE(a.location_name_snapshot,l.name) AS location_name,
      COALESCE(a.location_address_snapshot,l.address) AS address,
      COALESCE(a.location_city_snapshot,l.city) AS city,
      COALESCE(a.location_state_snapshot,l.state) AS state,
      COALESCE(a.location_country_snapshot,l.country) AS country,
      COALESCE(a.location_room_snapshot,dl.room) AS room
    FROM appointments a
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users u ON u.id=d.user_id
    LEFT JOIN locations l ON l.id=a.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=a.doctor_id AND dl.location_id=a.location_id
    WHERE a.patient_id=${p.id}
    ORDER BY a.starts_at DESC LIMIT 100`;

  const country=countryFromPhone(String(p.phone||''));
  const recommendations=await recommendedProviders(country);
  return NextResponse.json({
    patient:{name:p.full_name||name,email:p.email||email,phone:p.phone||'',country,nationalId:p.national_id||'',birthDate:dateForInput(p.birth_date),profileImage:avatar},
    appointments:aps.map((a:any)=>({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),status:a.status,serviceId:a.service_id?String(a.service_id):'',serviceName:a.service_name||a.provider_activity||'Servicio',price:Number(a.consultation_price||0),currency:a.consultation_currency||'USD',paymentMethod:a.payment_method||'',paymentReference:a.payment_reference||'',rescheduleUsed:Boolean(a.reschedule_used),receiptNumber:a.receipt_number||'',checkedInAt:a.checked_in_at?new Date(a.checked_in_at).toISOString():null,completedAt:a.completed_at?new Date(a.completed_at).toISOString():null,providerName:a.provider_name,providerSlug:a.public_slug,category:a.provider_category||'',activity:a.provider_activity||'',location:[a.location_name,a.address,a.city,a.state,a.country,a.room].filter(Boolean).join(' · ')})),
    recommendedProviders:recommendations
  });
}

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const p=await currentPatient();
  const body=await req.json();
  const action=String(body.action||'');
  const email=String((session.user as any).email||'').toLowerCase();

  if(action==='profile'){
    const name=String(body.name||'').trim();
    const phoneResult=validatePhone(String(body.phoneCountry||''),String(body.phoneLocal||''));
    const phone=phoneResult.phone;
    const national=normalizedDocument(body.nationalId);
    const birth=normalizedBirthDate(body.birthDate);
    const profileImage=String(body.profileImage||'');
    const mediaError=validateProviderMedia(profileImage,[]);
    if(mediaError)return NextResponse.json({error:mediaError},{status:400});
    if(!name)return NextResponse.json({error:'Escribe tu nombre.'},{status:400});
    if(phoneResult.error)return NextResponse.json({error:phoneResult.error},{status:400});
    if(national.error)return NextResponse.json({error:national.error},{status:400});
    if(birth.error)return NextResponse.json({error:birth.error},{status:400});
    await sql`UPDATE app_user_profiles SET full_name=${name},phone=${phone},avatar_data_url=${profileImage||null},updated_at=now() WHERE auth_user_id=${String(session.user.id)}`;
    await sql`UPDATE users SET full_name=${name},phone=${phone} WHERE lower(email)=lower(${email})`;
    if(p){
      await sql`UPDATE patients SET full_name=${name},phone=${phone},national_id=${national.value||null},birth_date=${birth.value}::date,email=${email},auth_user_id=${String(session.user.id)} WHERE id=${p.id}`;
    }else{
      const u=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
      await sql`INSERT INTO patients(user_id,auth_user_id,full_name,national_id,birth_date,phone,email)
        VALUES(${(u[0] as any)?.id||null},${String(session.user.id)},${name},${national.value||null},${birth.value}::date,${phone},${email})`;
    }
    return NextResponse.json({ok:true});
  }

  if(action==='reschedule'){
    if(!p) return NextResponse.json({error:'Perfil de cliente no encontrado'},{status:404});
    const appointmentId=String(body.id||'');
    const startsAt=String(body.startsAt||'');
    const rows=await sql`SELECT a.id,a.doctor_id,a.service_id,a.status,a.reschedule_used,ps.duration_minutes
      FROM appointments a
      LEFT JOIN provider_services ps ON ps.id=a.service_id
      WHERE a.id=${appointmentId}::uuid AND a.patient_id=${p.id}
      LIMIT 1`;
    const ap=rows[0] as any;
    if(!ap) return NextResponse.json({error:'Reserva no encontrada'},{status:404});
    if(ap.reschedule_used) return NextResponse.json({error:'Esta reserva ya utilizó su única reprogramación.'},{status:409});
    if(!['PAYMENT_REVIEW','CONFIRMED'].includes(String(ap.status))) return NextResponse.json({error:'Esta reserva ya no se puede reprogramar.'},{status:409});
    const requestedStart=new Date(startsAt);
    if(Number.isNaN(requestedStart.getTime())||requestedStart.getTime()<=Date.now()) return NextResponse.json({error:'Selecciona un horario futuro válido.'},{status:400});
    const duration=Math.max(5,Number(ap.duration_minutes||30));
    const requestedEnd=new Date(requestedStart.getTime()+duration*60000);

    const updated=await sql`
      WITH provider_lock AS (
        SELECT pg_advisory_xact_lock(hashtext(${String(ap.doctor_id)})::bigint)
      ),
      valid_block AS (
        SELECT ab.id,ab.location_id,l.name,l.address,l.city,l.state,l.country,dl.room
        FROM availability_blocks ab
        JOIN locations l ON l.id=ab.location_id
        LEFT JOIN doctor_locations dl ON dl.doctor_id=ab.doctor_id AND dl.location_id=ab.location_id,
        provider_lock
        WHERE ab.doctor_id=${ap.doctor_id}
          AND ab.published=true
          AND ab.starts_at<=${requestedStart.toISOString()}::timestamptz
          AND ab.ends_at>=${requestedEnd.toISOString()}::timestamptz
        LIMIT 1
      )
      UPDATE appointments a SET
        starts_at=${requestedStart.toISOString()}::timestamptz,
        ends_at=${requestedEnd.toISOString()}::timestamptz,
        location_id=vb.location_id,
        location_name_snapshot=vb.name,
        location_address_snapshot=vb.address,
        location_city_snapshot=vb.city,
        location_state_snapshot=vb.state,
        location_country_snapshot=vb.country,
        location_room_snapshot=vb.room,
        reschedule_used=true
      FROM valid_block vb
      WHERE a.id=${appointmentId}::uuid
        AND a.patient_id=${p.id}
        AND a.reschedule_used=false
        AND NOT EXISTS (
          SELECT 1 FROM appointments other
          WHERE other.doctor_id=${ap.doctor_id}
            AND other.id<>a.id
            AND other.status NOT IN ('CANCELLED','PAYMENT_REJECTED')
            AND other.starts_at<${requestedEnd.toISOString()}::timestamptz
            AND other.ends_at>${requestedStart.toISOString()}::timestamptz
        )
      RETURNING a.id`;
    if(!updated.length) return NextResponse.json({error:'Ese horario ya no está disponible. Elige otro.'},{status:409});
    return NextResponse.json({ok:true});
  }

  if(action==='appointment_status'){
    if(!p) return NextResponse.json({error:'Perfil de cliente no encontrado'},{status:404});
    const allowed=['ON_THE_WAY','ARRIVED','CANCELLED'];
    const status=String(body.status||'');
    if(!allowed.includes(status)) return NextResponse.json({error:'Estado no permitido'},{status:400});
    const rows=await sql`UPDATE appointments SET status=${status}::appointment_status WHERE id=${body.id}::uuid AND patient_id=${p.id} RETURNING id`;
    if(!rows.length) return NextResponse.json({error:'Reserva no encontrada'},{status:404});
    return NextResponse.json({ok:true});
  }

  return NextResponse.json({error:'Acción inválida'},{status:400});
}
