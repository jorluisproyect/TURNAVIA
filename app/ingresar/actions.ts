'use server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function signInUser(_prev:{error?:string}|null, formData:FormData){
  const email=String(formData.get('email')||'').trim().toLowerCase();
  const password=String(formData.get('password')||'');
  const {error}=await auth.signIn.email({email,password});
  if(error) return {error:error.message||'Correo o contraseña incorrectos.'};
  if(sql){
    const users=await sql`SELECT id,name,email FROM neon_auth.user WHERE lower(email)=lower(${email}) LIMIT 1`;
    const u=users[0] as any;
    if(u){
      const role=email==='jorgeluisananguren@gmail.com'?'MASTER':'PATIENT';
      await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email)
        VALUES(${String(u.id)},${role}::user_role,${String(u.name||email)},${email})
        ON CONFLICT(auth_user_id) DO UPDATE SET
          role=CASE WHEN lower(EXCLUDED.email)=lower('jorgeluisananguren@gmail.com') THEN 'MASTER'::user_role ELSE app_user_profiles.role END,
          full_name=COALESCE(app_user_profiles.full_name,EXCLUDED.full_name),
          email=EXCLUDED.email,
          updated_at=now()`;
    }
  }
  redirect('/panel');
}
