import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

async function currentPatient(){
  if(!sql) return null;
  const {data:session}=await auth.getSession();
  if(!session?.user) return null;
  const authId=String(session.user.id);
  const email=String((session.user as any).email||'').toLowerCase();
  const rows=await sql`SELECT p.id,p.full_name,p.phone,p.email,p.national_id,p.auth_user_id,u.id AS user_id
    FROM patients p LEFT JOIN users u ON u.id=p.user_id
    WHERE p.auth_user_id=${authId} OR lower(p.email)=lower(${email})
    ORDER BY p.created_at DESC LIMIT 1`;
  return rows[0] as any || null;
}

export async function GET(){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const p=await currentPatient();
  const email=String((session.user as any).email||'');
  const name=String((session.user as any).name||'Cliente');

  if(!p) return NextResponse.json({patient:{name,email,phone:'',nationalId:''},appointments:[]});

  const aps=await sql`SELECT a.id,a.starts_at,a.ends_at,a.status,a.service_id,a.service_name,a.consultation_price,a.consultation_currency,
      a.payment_method,a.payment_reference,a.reschedule_used,
      d.public_slug,d.provider_category,d.provider_activity,u.full_name AS provider_name,
      l.name AS location_name,l.address,l.city
    FROM appointments a
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users u ON u.id=d.user_id
    LEFT JOIN locations l ON l.id=a.location_id
    WHERE a.patient_id=${p.id}
    ORDER BY a.starts_at DESC LIMIT 100`;

  return NextResponse.json({
    patient:{name:p.full_name||name,email:p.email||email,phone:p.phone||'',nationalId:p.national_id||''},
    appointments:aps.map((a:any)=>({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),status:a.status,serviceId:a.service_id?String(a.service_id):'',serviceName:a.service_name||a.provider_activity||'Servicio',price:Number(a.consultation_price||0),currency:a.consultation_currency||'USD',paymentMethod:a.payment_method||'',paymentReference:a.payment_reference||'',rescheduleUsed:Boolean(a.reschedule_used),providerName:a.provider_name,providerSlug:a.public_slug,category:a.provider_category||'',activity:a.provider_activity||'',location:[a.location_name,a.address,a.city].filter(Boolean).join(' · ')}))
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
    const phone=String(body.phone||'').trim();
    const nationalId=String(body.nationalId||'').trim();
    if(!name||!phone) return NextResponse.json({error:'Nombre y teléfono son obligatorios'},{status:400});
    await sql`UPDATE neon_auth.user SET name=${name} WHERE lower(email)=lower(${email})`;
    await sql`UPDATE app_user_profiles SET full_name=${name},phone=${phone},updated_at=now() WHERE lower(email)=lower(${email})`;
    await sql`UPDATE users SET full_name=${name},phone=${phone} WHERE lower(email)=lower(${email})`;
    if(p){
      await sql`UPDATE patients SET full_name=${name},phone=${phone},national_id=${nationalId||null},email=${email},auth_user_id=${String(session.user.id)} WHERE id=${p.id}`;
    }else{
      const u=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
      await sql`INSERT INTO patients(user_id,auth_user_id,full_name,national_id,phone,email) VALUES(${(u[0] as any)?.id||null},${String(session.user.id)},${name},${nationalId||null},${phone},${email})`;
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
        SELECT ab.id FROM availability_blocks ab,provider_lock
        WHERE ab.doctor_id=${ap.doctor_id}
          AND ab.published=true
          AND ab.starts_at<=${requestedStart.toISOString()}::timestamptz
          AND ab.ends_at>=${requestedEnd.toISOString()}::timestamptz
        LIMIT 1
      )
      UPDATE appointments a SET
        starts_at=${requestedStart.toISOString()}::timestamptz,
        ends_at=${requestedEnd.toISOString()}::timestamptz,
        reschedule_used=true
      WHERE a.id=${appointmentId}::uuid
        AND a.patient_id=${p.id}
        AND a.reschedule_used=false
        AND EXISTS (SELECT 1 FROM valid_block)
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
