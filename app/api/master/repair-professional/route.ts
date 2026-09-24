import { NextResponse } from 'next/server';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function slugify(input:string){
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,38)||'profesional';
}

export async function POST(req:Request){
  if(!(await isOwnerMasterSession())){
    return NextResponse.json({error:'Solo el Master propietario puede reparar profesionales.'},{status:403});
  }
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});

  const body=await req.json().catch(()=>({}));
  const authUserId=String(body.authUserId||'').trim();
  if(!authUserId)return NextResponse.json({error:'Profesional no identificado.'},{status:400});

  try{
    const profiles=await sql`
      SELECT auth_user_id,full_name,email,phone,role::text AS role
      FROM app_user_profiles
      WHERE auth_user_id=${authUserId}
      LIMIT 1`;
    if(!profiles.length)return NextResponse.json({error:'El perfil base ya no existe.'},{status:404});

    const p=profiles[0] as any;
    const email=String(p.email||'').trim().toLowerCase();
    const name=String(p.full_name||email.split('@')[0]||'Profesional').trim();
    const phone=String(p.phone||'').trim();

    if(!email||email===MASTER_EMAIL)return NextResponse.json({error:'Cuenta no válida para reparación.'},{status:400});
    if(String(p.role)!=='DOCTOR'){
      await sql`UPDATE app_user_profiles SET role='DOCTOR'::user_role,updated_at=now() WHERE auth_user_id=${authUserId}`;
    }

    const commercialRows=await sql`
      SELECT id,status,category,subcategory,type,phone,trial_ends_at,payment_reviewed_at
      FROM commercial_clients
      WHERE lower(email)=lower(${email})
      ORDER BY created_at DESC
      LIMIT 1`;
    const commercial=commercialRows[0] as any;

    const category=String(commercial?.category||'Otro');
    const activity=String(commercial?.subcategory||'Otro servicio con citas');
    const providerType=String(commercial?.type||'Profesional independiente');
    const effectivePhone=phone||String(commercial?.phone||'');

    let users=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
    let userId=(users[0] as any)?.id;
    if(!userId){
      const created=await sql`INSERT INTO users(role,full_name,email,phone,active)
        VALUES('DOCTOR',${name},${email},${effectivePhone},true)
        RETURNING id`;
      userId=(created[0] as any)?.id;
    }else{
      await sql`UPDATE users
        SET role='DOCTOR',full_name=${name},phone=COALESCE(NULLIF(${effectivePhone},''),phone),active=true
        WHERE id=${userId}`;
    }

    let doctors=await sql`SELECT id,public_slug FROM doctors WHERE user_id=${userId} LIMIT 1`;
    let doctorId=(doctors[0] as any)?.id;
    if(!doctorId){
      const slug=slugify(name)+'-'+authUserId.replace(/[^a-z0-9]/gi,'').slice(-8).toLowerCase();
      const created=await sql`INSERT INTO doctors(
          user_id,public_slug,specialty,provider_category,provider_activity,provider_type,
          consultation_price,consultation_currency,accepts_online_booking
        )
        VALUES(
          ${userId},${slug},${activity},${category},${activity},${providerType},
          0,'USD',true
        )
        RETURNING id`;
      doctorId=(created[0] as any)?.id;
    }else{
      await sql`UPDATE doctors SET
        specialty=COALESCE(NULLIF(specialty,''),${activity}),
        provider_category=COALESCE(NULLIF(provider_category,''),${category}),
        provider_activity=COALESCE(NULLIF(provider_activity,''),${activity}),
        provider_type=COALESCE(NULLIF(provider_type,''),${providerType}),
        accepts_online_booking=true
        WHERE id=${doctorId}`;
    }

    const services=await sql`SELECT id FROM provider_services WHERE doctor_id=${doctorId} LIMIT 1`;
    if(!services.length){
      await sql`INSERT INTO provider_services(doctor_id,name,duration_minutes,price,currency,active)
        VALUES(${doctorId},${activity==='Otro servicio con citas'?'Servicio por configurar':activity},30,0,'USD',true)`;
    }

    let trialReset=false;
    if(commercial){
      const needsTrial=!commercial.trial_ends_at && !commercial.payment_reviewed_at && String(commercial.status)!=='ACTIVO';
      await sql`UPDATE commercial_clients SET
        name=${name},
        type=COALESCE(NULLIF(type,''),${providerType}),
        category=COALESCE(NULLIF(category,''),${category}),
        subcategory=COALESCE(NULLIF(subcategory,''),${activity}),
        specialty=COALESCE(NULLIF(specialty,''),${activity}),
        phone=COALESCE(NULLIF(phone,''),${effectivePhone}),
        auth_user_id=${authUserId},
        status=CASE WHEN status='ACTIVO' THEN status WHEN ${needsTrial} THEN 'TRIAL' ELSE status END,
        trial_ends_at=CASE WHEN ${needsTrial} THEN now()+interval '15 days' ELSE trial_ends_at END
        WHERE id=${commercial.id}`;
      trialReset=Boolean(needsTrial);
    }else{
      await sql`INSERT INTO commercial_clients(
        name,type,category,subcategory,specialty,phone,email,status,trial_ends_at,auth_user_id
      ) VALUES(
        ${name},${providerType},${category},${activity},${activity},
        ${effectivePhone},${email},'TRIAL',now()+interval '15 days',${authUserId}
      )`;
      trialReset=true;
    }

    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(
          'PROFESSIONAL_REPAIRED','ACCOUNT_PROFILE',${authUserId},
          jsonb_build_object('email',${email}::text,'trialReset',${trialReset}::boolean)
        )`;
    }catch{}

    return NextResponse.json({
      ok:true,
      message:trialReset
        ?'Perfil reparado. Tiene 15 días de prueba desde hoy.'
        :'Perfil reparado conservando su estado comercial actual.'
    });
  }catch(error:any){
    console.error('TUCITA professional repair error',error);
    return NextResponse.json({
      error:'No se pudo reparar este perfil. Detalle: '+String(error?.message||error||'Error desconocido').slice(0,500)
    },{status:500});
  }
}
