'use server';
import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export async function signInUser(_prev:{error?:string}|null, formData:FormData){
  const email=String(formData.get('email')||'').trim().toLowerCase();
  const password=String(formData.get('password')||'');
  const {error}=await auth.signIn.email({email,password});
  if(error) return {error:error.message||'Correo o contraseña incorrectos.'};
  redirect('/panel');
}
