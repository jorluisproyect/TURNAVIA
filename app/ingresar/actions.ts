'use server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MASTER_EMAIL } from '@/lib/access';

export async function signInUser(_prev:{error?:string}|null, formData:FormData){
  const email=String(formData.get('email')||'').trim().toLowerCase();
  const password=String(formData.get('password')||'');
  const {error}=await auth.signIn.email({email,password});
  if(error) return {error:error.message||'Correo o contraseña incorrectos.'};

  if(sql){
    const authRows=await sql`SELECT id,name,email FROM neon_auth.user WHERE lower(email)=lower(${email}) LIMIT 1`;
    const u=authRows[0] as any;
    if(u){
      let role='PATIENT';
      if(email===MASTER_EMAIL) role='MASTER';
      else{
        const existing=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(u.id)} LIMIT 1`;
        if(existing.length) role=String((existing[0] as any).role||'PATIENT');
        else{
          const internal=await sql`SELECT role FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
          if(internal.length) role=String((internal[0] as any).role||'PATIENT');
        }
      }

      await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email)
        VALUES(${String(u.id)},${role}::user_role,${String(u.name||email)},${email})
        ON CONFLICT(auth_user_id) DO UPDATE SET
          role=CASE WHEN lower(EXCLUDED.email)=lower(${MASTER_EMAIL}) THEN 'MASTER'::user_role ELSE app_user_profiles.role END,
          full_name=COALESCE(app_user_profiles.full_name,EXCLUDED.full_name),
          email=EXCLUDED.email,
          updated_at=now()`;
    }
  }
  redirect('/panel');
}
