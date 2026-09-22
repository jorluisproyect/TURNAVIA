import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { MASTER_EMAIL } from '@/lib/access';

export const dynamic='force-dynamic';

async function staffContext(token:string){
  if(!sql)return null;
  const {data:session}=await auth.getSession();
  if(!session?.user)return null;
  const email=String((session.user as any).email||'').toLowerCase();
  const rows=await sql`SELECT a.id,a.status,a.starts_at,a.ends_at,a.service_name,a.receipt_number,a.checked_in_at,a.completed_at,
      p.full_name AS client_name,p.phone AS client_phone,
      u.full_name AS provider_name,u.email AS provider_email,u.organization_id AS provider_org,
      COALESCE(a.location_name_snapshot,l.name) AS location_name,
      COALESCE(a.location_address_snapshot,l.address) AS location_address,
      COALESCE(a.location_city_snapshot,l.city) AS location_city,
      COALESCE(a.location_state_snapshot,l.state) AS location_state,
      COALESCE(a.location_country_snapshot,l.country) AS location_country,
      COALESCE(a.location_room_snapshot,dl.room) AS location_room,
      su.organization_id AS session_org,ap.role AS app_role
    FROM appointments a
    JOIN patients p ON p.id=a.patient_id
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users u ON u.id=d.user_id
    LEFT JOIN locations l ON l.id=a.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=a.doctor_id AND dl.location_id=a.location_id
    LEFT JOIN users su ON lower(su.email)=lower(${email})
    LEFT JOIN app_user_profiles ap ON ap.auth_user_id=${String(session.user.id)}
    WHERE a.checkin_token=${token} LIMIT 1`;
  const r=rows[0] as any;
  if(!r)return null;
  const role=email===MASTER_EMAIL?'MASTER':String(r.app_role||'');
  const owner=String(r.provider_email||'').toLowerCase()===email;
  const orgStaff=['RECEPTION','CLINIC_ADMIN'].includes(role)&&r.session_org&&String(r.session_org)===String(r.provider_org);
  const allowed=role==='MASTER'||role==='DOCTOR'&&owner||owner||orgStaff;
  return allowed?{row:r,session,email,role}:null;
}

export async function GET(_req:Request,ctx:{params:Promise<{token:string}>}){
  const {token}=await ctx.params;
  const c=await staffContext(token);
  if(!c)return NextResponse.json({error:'Código no válido o acceso no autorizado'},{status:403});
  const r=c.row;
  return NextResponse.json({appointment:{
    id:String(r.id),status:r.status,receiptNumber:r.receipt_number,clientName:r.client_name,clientPhone:r.client_phone,
    providerName:r.provider_name,serviceName:r.service_name,
    startsAt:new Date(r.starts_at).toISOString(),endsAt:new Date(r.ends_at).toISOString(),
    checkedInAt:r.checked_in_at?new Date(r.checked_in_at).toISOString():null,
    completedAt:r.completed_at?new Date(r.completed_at).toISOString():null,
    location:{name:r.location_name||'',address:r.location_address||'',city:r.location_city||'',state:r.location_state||'',country:r.location_country||'',room:r.location_room||''}
  }});
}

export async function POST(req:Request,ctx:{params:Promise<{token:string}>}){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {token}=await ctx.params;
  const c=await staffContext(token);
  if(!c)return NextResponse.json({error:'Código no válido o acceso no autorizado'},{status:403});
  const body=await req.json();
  const action=String(body.action||'');
  const r=c.row;
  if(action==='arrive'){
    if(!['CONFIRMED','ON_THE_WAY','ARRIVED'].includes(String(r.status)))return NextResponse.json({error:'La cita no está disponible para registrar llegada.'},{status:409});
    await sql`UPDATE appointments SET status='ARRIVED',checked_in_at=COALESCE(checked_in_at,now()),checked_in_by=${c.email} WHERE id=${String(r.id)}::uuid`;
  }else if(action==='complete'){
    if(!['ARRIVED','IN_CONSULTATION','COMPLETED'].includes(String(r.status)))return NextResponse.json({error:'Primero debe registrarse la llegada.'},{status:409});
    await sql`UPDATE appointments SET status='COMPLETED',completed_at=COALESCE(completed_at,now()) WHERE id=${String(r.id)}::uuid`;
  }else if(action==='start'){
    if(String(r.status)!=='ARRIVED')return NextResponse.json({error:'La cita debe estar marcada como llegada.'},{status:409});
    await sql`UPDATE appointments SET status='IN_CONSULTATION' WHERE id=${String(r.id)}::uuid`;
  }else return NextResponse.json({error:'Acción inválida'},{status:400});

  try{
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES(${action==='arrive'?'QR_CHECKIN':action==='start'?'SERVICE_STARTED':'SERVICE_COMPLETED'},'APPOINTMENT',${String(r.id)},jsonb_build_object('by',${c.email},'receiptNumber',${String(r.receipt_number||'')}))`;
  }catch{}
  return NextResponse.json({ok:true});
}
