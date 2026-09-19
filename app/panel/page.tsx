import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MASTER_EMAIL } from '@/lib/access';

export const dynamic='force-dynamic';

export default async function Panel(){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const sessionEmail=String((session.user as any).email||'').toLowerCase();
  if(sessionEmail===MASTER_EMAIL) redirect('/master');

  let role='PATIENT';
  if(sql){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    role=String((rows[0] as any)?.role||'PATIENT');
  }
  if(role==='DOCTOR') redirect('/medico');
  if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion');
  if(role==='MASTER') redirect('/master');
  redirect('/paciente');
}
