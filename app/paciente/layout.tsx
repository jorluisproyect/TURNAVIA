import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { profileIsDeleted } from '@/lib/profile-lifecycle';
import { cookies } from 'next/headers';

export const dynamic='force-dynamic';

export default async function PacienteLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const deletedEmail=String((session.user as any).email||'').toLowerCase();
  if(await profileIsDeleted(deletedEmail)) redirect('/cuenta/eliminada');
  if(sql){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    const role=String((rows[0] as any)?.role||'PATIENT');
    if(role==='MASTER') redirect('/master');
    if(role==='DOCTOR'){
      const jar=await cookies();
      const preferredMode=String(jar.get('tucita_mode')?.value||'').toUpperCase();
      if(preferredMode!=='PATIENT') redirect('/medico');

      const email=String((session.user as any).email||'').toLowerCase();
      const patientRows=await sql`SELECT id FROM patients
        WHERE auth_user_id=${String(session.user.id)}
           OR lower(COALESCE(email,''))=lower(${email})
        ORDER BY created_at DESC
        LIMIT 1`;
      if(!patientRows.length) redirect('/medico');
    }
    if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion');
  }
  return children;
}
