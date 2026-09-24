import { NextResponse } from 'next/server';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:Request){
  if(!(await isOwnerMasterSession())){
    return NextResponse.json({error:'Solo el Master propietario puede reparar usuarios.'},{status:403});
  }
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});

  const body=await req.json().catch(()=>({}));
  const authUserId=String(body.authUserId||'').trim();
  if(!authUserId)return NextResponse.json({error:'Usuario no identificado.'},{status:400});

  try{
    const profiles=await sql`
      SELECT auth_user_id,full_name,email,phone,role::text AS role
      FROM app_user_profiles
      WHERE auth_user_id=${authUserId}
      LIMIT 1`;
    if(!profiles.length)return NextResponse.json({error:'El perfil base no existe.'},{status:404});

    const p=profiles[0] as any;
    const email=String(p.email||'').trim().toLowerCase();
    const name=String(p.full_name||email.split('@')[0]||'Usuario').trim();
    const phone=String(p.phone||'').trim();

    if(!email||email===MASTER_EMAIL)return NextResponse.json({error:'Cuenta no válida para reparación.'},{status:400});
    if(String(p.role)!=='PATIENT'){
      return NextResponse.json({error:'Esta cuenta no es un usuario final.'},{status:409});
    }

    let users=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
    let userId=(users[0] as any)?.id;
    if(!userId){
      const created=await sql`INSERT INTO users(role,full_name,email,phone,active)
        VALUES('PATIENT',${name},${email},${phone},true)
        RETURNING id`;
      userId=(created[0] as any)?.id;
    }else{
      await sql`UPDATE users SET role='PATIENT',full_name=${name},phone=${phone},active=true WHERE id=${userId}`;
    }

    const patients=await sql`
      SELECT id FROM patients
      WHERE auth_user_id=${authUserId}
         OR lower(COALESCE(email,''))=lower(${email})
      ORDER BY created_at DESC
      LIMIT 1`;

    if(patients.length){
      await sql`UPDATE patients SET
        user_id=${userId},
        auth_user_id=${authUserId},
        full_name=${name},
        phone=${phone},
        email=${email}
        WHERE id=${(patients[0] as any).id}`;
    }else{
      await sql`INSERT INTO patients(user_id,auth_user_id,full_name,phone,email)
        VALUES(${userId},${authUserId},${name},${phone},${email})`;
    }

    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(
          'FINAL_USER_REPAIRED','ACCOUNT_PROFILE',${authUserId},
          jsonb_build_object('email',${email}::text,'masterRepair',true)
        )`;
    }catch{}

    return NextResponse.json({ok:true,message:'Usuario sincronizado correctamente.'});
  }catch(error:any){
    console.error('TUCITA final user repair error',error);
    return NextResponse.json({
      error:'No se pudo reparar este usuario. Detalle: '+String(error?.message||error||'Error desconocido').slice(0,500)
    },{status:500});
  }
}
