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
    return NextResponse.json({error:'Solo el Master propietario puede recuperar profesionales.'},{status:403});
  }
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});

  const body=await req.json().catch(()=>({}));
  const authUserId=String(body.authUserId||'').trim();
  if(!authUserId)return NextResponse.json({error:'Cuenta de acceso inválida.'},{status:400});

  try{
    const authRows=await sql`
      SELECT
        au.id::text AS id,
        au.email,
        COALESCE(NULLIF(to_jsonb(au)->>'name',''),split_part(au.email,'@',1)) AS full_name
      FROM neon_auth."user" au
      WHERE au.id::text=${authUserId}
        AND lower(au.email)<>lower(${MASTER_EMAIL})
      LIMIT 1`;

    if(!authRows.length)return NextResponse.json({error:'La cuenta de acceso ya no existe.'},{status:404});

    const authUser=authRows[0] as any;
    const email=String(authUser.email||'').trim().toLowerCase();
    const name=String(authUser.full_name||email.split('@')[0]||'Profesional').trim();

    const existingProfile=await sql`
      SELECT auth_user_id
      FROM app_user_profiles
      WHERE auth_user_id=${authUserId}
         OR lower(email)=lower(${email})
      LIMIT 1`;
    if(existingProfile.length){
      return NextResponse.json({error:'Esta cuenta ya tiene un perfil TUCITA. Actualiza la página.'},{status:409});
    }

    await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email,phone)
      VALUES(${authUserId},'DOCTOR'::user_role,${name},${email},'')
      ON CONFLICT(auth_user_id) DO UPDATE SET role='DOCTOR'::user_role,full_name=EXCLUDED.full_name,email=EXCLUDED.email,updated_at=now()`;

    let userRows=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
    let userId=(userRows[0] as any)?.id;
    if(!userId){
      const created=await sql`INSERT INTO users(role,full_name,email,phone,active)
        VALUES('DOCTOR',${name},${email},'',true)
        RETURNING id`;
      userId=(created[0] as any)?.id;
    }else{
      await sql`UPDATE users SET role='DOCTOR',full_name=${name},active=true WHERE id=${userId}`;
    }

    const slug=slugify(name)+'-'+authUserId.replace(/[^a-z0-9]/gi,'').slice(-8).toLowerCase();
    const doctorRows=await sql`INSERT INTO doctors(
        user_id,public_slug,specialty,provider_category,provider_activity,provider_type,
        consultation_price,consultation_currency
      )
      VALUES(
        ${userId},${slug},'Otro servicio con citas','Otro','Otro servicio con citas',
        'Profesional independiente',0,'USD'
      )
      ON CONFLICT(user_id) DO UPDATE SET
        specialty=EXCLUDED.specialty,
        provider_category=EXCLUDED.provider_category,
        provider_activity=EXCLUDED.provider_activity,
        provider_type=EXCLUDED.provider_type
      RETURNING id`;
    const doctorId=(doctorRows[0] as any)?.id;

    const services=await sql`SELECT id FROM provider_services WHERE doctor_id=${doctorId} LIMIT 1`;
    if(!services.length){
      await sql`INSERT INTO provider_services(doctor_id,name,duration_minutes,price,currency,active)
        VALUES(${doctorId},'Servicio por configurar',30,0,'USD',true)`;
    }

    const commercial=await sql`SELECT id FROM commercial_clients WHERE lower(email)=lower(${email}) ORDER BY created_at DESC LIMIT 1`;
    if(commercial.length){
      await sql`UPDATE commercial_clients SET
        name=${name},
        type='Profesional independiente',
        category='Otro',
        subcategory='Otro servicio con citas',
        specialty='Otro servicio con citas',
        auth_user_id=${authUserId},
        status='TRIAL',
        trial_ends_at=now()+interval '15 days',
        payment_reviewed_at=NULL,
        payment_submitted_at=NULL,
        payment_rejection_reason=NULL
        WHERE id=${(commercial[0] as any).id}`;
    }else{
      await sql`INSERT INTO commercial_clients(
        name,type,category,subcategory,specialty,phone,email,status,trial_ends_at,auth_user_id
      ) VALUES(
        ${name},'Profesional independiente','Otro','Otro servicio con citas','Otro servicio con citas',
        '',${email},'TRIAL',now()+interval '15 days',${authUserId}
      )`;
    }

    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(
          'PROFESSIONAL_RECOVERED','ACCOUNT_PROFILE',${authUserId},
          jsonb_build_object('email',${email}::text,'masterRecovery',true)
        )`;
    }catch{}

    return NextResponse.json({
      ok:true,
      message:'Profesional restaurado con 15 días de prueba.',
      email
    });
  }catch(error:any){
    console.error('TUCITA professional recovery error',error);
    return NextResponse.json({
      error:'No se pudo restaurar este profesional. Detalle: '+String(error?.message||error||'Error desconocido').slice(0,500)
    },{status:500});
  }
}
