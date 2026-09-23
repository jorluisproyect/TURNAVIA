import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { profileIsDeleted } from '@/lib/profile-lifecycle';
import { MASTER_EMAIL } from '@/lib/access';
import { refreshCommercialClientByEmail, subscriptionAllowed } from '@/lib/subscription';

export const dynamic='force-dynamic';

export default async function MedicoLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const deletedEmail=String((session.user as any).email||'').toLowerCase();
  if(await profileIsDeleted(deletedEmail)) redirect('/cuenta/eliminada');
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL) redirect('/master');
  if(!sql) redirect('/ingresar');
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  const role=String((rows[0] as any)?.role||'PATIENT');
  if(role==='PATIENT') redirect('/paciente');
  if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion');
  if(role!=='DOCTOR') redirect('/panel');

  const commercial=await refreshCommercialClientByEmail(email);
  if(commercial && !subscriptionAllowed(String(commercial.status||''),commercial.trial_ends_at)){
    redirect('/pago?client='+String(commercial.id));
  }
  return children;
}
