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

  const aps=await sql`SELECT a.id,a.starts_at,a.ends_at,a.status,a.service_name,a.consultation_price,a.consultation_currency,
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
    appointments:aps.map((a:any)=>({id:String(a.id),startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),status:a.status,serviceName:a.service_name||a.provider_activity||'Servicio',price:Number(a.consultation_price||0),currency:a.consultation_currency||'USD',paymentMethod:a.payment_method||'',paymentReference:a.payment_reference||'',rescheduleUsed:Boolean(a.reschedule_used),providerName:a.provider_name,providerSlug:a.public_slug,category:a.provider_category||'',activity:a.provider_activity||'',location:[a.location_name,a.address,a.city].filter(Boolean).join(' · ')}))
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
