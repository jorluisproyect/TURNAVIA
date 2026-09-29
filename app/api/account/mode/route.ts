import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

async function accountCapabilities(){
  if(!sql)return null;
  const {data:session}=await auth.getSession();
  if(!session?.user)return null;

  const authUserId=String(session.user.id);
  const email=String((session.user as any).email||'').trim().toLowerCase();
  if(!email)return null;

  const profileRows=await sql`SELECT full_name,email,phone,avatar_data_url,role
    FROM app_user_profiles
    WHERE auth_user_id=${authUserId} OR lower(email)=lower(${email})
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1`;
  const profile=(profileRows[0] as any)||{};

  const doctorRows=await sql`SELECT d.id,d.public_slug,u.id AS user_id,u.active
    FROM doctors d
    JOIN users u ON u.id=d.user_id
    WHERE lower(u.email)=lower(${email})
    ORDER BY u.created_at
    LIMIT 1`;
  const doctor=(doctorRows[0] as any)||null;

  const patientRows=await sql`SELECT id,user_id,auth_user_id
    FROM patients
    WHERE auth_user_id=${authUserId}
       OR lower(COALESCE(email,''))=lower(${email})
       OR (${doctor?.user_id||null}::uuid IS NOT NULL AND user_id=${doctor?.user_id||null}::uuid)
    ORDER BY created_at DESC
    LIMIT 1`;
  const patient=(patientRows[0] as any)||null;

  return {session,authUserId,email,profile,doctor,patient};
}

export async function GET(){
  const account=await accountCapabilities();
  if(!account)return NextResponse.json({error:'No autorizado'},{status:401});
  const jar=await cookies();
  const stored=String(jar.get('tucita_mode')?.value||'').toUpperCase();
  const currentMode=stored==='PATIENT'&&account.patient?'PATIENT':account.doctor?'DOCTOR':'PATIENT';
  return NextResponse.json({
    currentMode,
    hasProfessional:Boolean(account.doctor),
    hasClient:Boolean(account.patient),
    canActivateClient:Boolean(account.doctor)
  });
}

export async function POST(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const account=await accountCapabilities();
  if(!account)return NextResponse.json({error:'No autorizado'},{status:401});

  const body=await req.json().catch(()=>({}));
  const mode=String(body.mode||'').toUpperCase();
  if(!['PATIENT','DOCTOR'].includes(mode)){
    return NextResponse.json({error:'Modo de cuenta inválido.'},{status:400});
  }

  if(mode==='DOCTOR'){
    if(!account.doctor)return NextResponse.json({error:'Esta cuenta todavía no tiene perfil profesional.'},{status:409});
    const jar=await cookies();
    jar.set('tucita_mode','DOCTOR',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*365});
    return NextResponse.json({ok:true,mode:'DOCTOR',redirect:'/medico?modeChanged=professional'});
  }

  let patient=account.patient;
  if(!patient){
    const name=String(account.profile?.full_name||(account.session.user as any)?.name||'Cliente').trim()||'Cliente';
    const phone=String(account.profile?.phone||'').trim();
    const internalUserId=account.doctor?.user_id||null;

    const rows=await sql`INSERT INTO patients(user_id,auth_user_id,full_name,phone,email)
      VALUES(${internalUserId},${account.authUserId},${name},${phone},${account.email})
      RETURNING id,user_id,auth_user_id`;
    patient=(rows[0] as any)||null;

    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES('CLIENT_MODE_ACTIVATED','ACCOUNT_PROFILE',${account.authUserId},
          jsonb_build_object('email',${account.email},'source','PROFESSIONAL_ACCOUNT'))`;
    }catch(error){
      console.error('TUCITA client mode audit warning',error);
    }
  }else{
    await sql`UPDATE patients
      SET auth_user_id=COALESCE(NULLIF(auth_user_id,''),${account.authUserId}),
          user_id=COALESCE(user_id,${account.doctor?.user_id||null}::uuid),
          email=COALESCE(NULLIF(email,''),${account.email})
      WHERE id=${String(patient.id)}::uuid`;
  }

  const jar=await cookies();
  jar.set('tucita_mode','PATIENT',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*365});
  return NextResponse.json({
    ok:true,
    mode:'PATIENT',
    createdClientProfile:!account.patient,
    redirect:'/paciente?modeChanged=client'
  });
}


export async function DELETE(){
  const jar=await cookies();
  jar.set('tucita_mode','',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:0});
  return NextResponse.json({ok:true});
}
