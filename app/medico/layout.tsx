import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';
const MASTER_EMAIL='jorgeluisananguren@gmail.com';

export default async function MedicoLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL) redirect('/master');
  if(!sql) redirect('/ingresar');
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  const role=String((rows[0] as any)?.role||'PATIENT');
  if(role==='PATIENT') redirect('/paciente');
  if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion');
  if(role!=='DOCTOR') redirect('/panel');
  return children;
}
