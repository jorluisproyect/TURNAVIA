'use server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';
import { redirect } from 'next/navigation';

export async function registerUser(_prev:{error?:string}|null, formData:FormData){
  const name=String(formData.get('name')||'').trim();
  const email=String(formData.get('email')||'').trim().toLowerCase();
  const password=String(formData.get('password')||'');
  const phone=String(formData.get('phone')||'').trim();
  const rawRole=String(formData.get('role')||'PATIENT');
  const requestedRole=rawRole==='DOCTOR'?'DOCTOR':'PATIENT';
  const role=email==='jorgeluisananguren@gmail.com'?'MASTER':requestedRole;
  if(!name||!email||password.length<8) return {error:'Completa los datos y usa una contraseña de al menos 8 caracteres.'};

  const {data,error}=await auth.signUp.email({name,email,password});
  if(error) return {error:error.message||'No se pudo crear la cuenta.'};
  const userId=(data as any)?.user?.id || (data as any)?.id;
  if(userId && sql){
    await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email,phone)
      VALUES(${String(userId)},${role}::user_role,${name},${email},${phone||null})
      ON CONFLICT(auth_user_id) DO UPDATE SET role=EXCLUDED.role,full_name=EXCLUDED.full_name,email=EXCLUDED.email,phone=EXCLUDED.phone,updated_at=now()`;
    if(role==='DOCTOR'){
      await sql`INSERT INTO commercial_clients(name,type,specialty,phone,email,status,trial_ends_at,auth_user_id)
        VALUES(${name},'Médico independiente',NULL,${phone||null},${email},'TRIAL',now()+interval '5 days',${String(userId)})
        ON CONFLICT DO NOTHING`;
    }
  }

  await sendTransactionalEmail({
    to:email,
    subject:'Tu cuenta TURNAVIA fue creada',
    html:turnaviaEmail('Bienvenido a TURNAVIA',`<p>Hola <strong>${name}</strong>.</p><p>Tu cuenta fue creada correctamente.</p><p><strong>Usuario:</strong> ${email}</p><p>Por seguridad, tu contraseña no se envía por correo.</p><p><a href="${process.env.APP_URL||'https://turnavia.vercel.app'}/ingresar">Entrar a TURNAVIA</a></p>`)
  });

  redirect(role==='MASTER'?'/master':role==='DOCTOR'?'/panel':'/panel');
}
