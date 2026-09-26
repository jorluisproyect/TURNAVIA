import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { profileIsDeleted } from '@/lib/profile-lifecycle';

export const dynamic='force-dynamic';

export async function DELETE(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isOwnerMasterSession()))return NextResponse.json({error:'No autorizado'},{status:403});

  const body=await req.json().catch(()=>({}));
  const email=String(body.email||'').trim().toLowerCase();
  if(!email)return NextResponse.json({error:'Correo requerido.'},{status:400});
  if(email===MASTER_EMAIL)return NextResponse.json({error:'La cuenta Master no puede eliminarse.'},{status:403});
  if(await profileIsDeleted(email))return NextResponse.json({ok:true,alreadyDeleted:true});

  const rows=await sql`SELECT auth_user_id,role,full_name
    FROM app_user_profiles
    WHERE lower(email)=lower(${email})
    ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
  const profile=rows[0] as any;
  if(!profile||String(profile.role)!=='PATIENT')return NextResponse.json({error:'Usuario final no encontrado.'},{status:404});

  await sql`UPDATE users SET active=false WHERE lower(COALESCE(email,''))=lower(${email})`;
  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('PROFILE_DELETED','ACCOUNT_PROFILE',${String(profile.auth_user_id||email)},
      jsonb_build_object(
        'email',${email},
        'name',${String(profile.full_name||'Usuario')},
        'role','PATIENT',
        'professional',false,
        'deletedByMaster',true
      ))`;

  return NextResponse.json({ok:true,message:'Usuario movido a Perfiles eliminados.'});
}
