import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';

export default async function PacienteLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  if(sql){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    const role=String((rows[0] as any)?.role||'PATIENT');
    if(role==='MASTER') redirect('/master');
    if(role==='DOCTOR') redirect('/medico');
    if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion');
  }
  return children;
}
