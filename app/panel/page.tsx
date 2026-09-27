import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { profileIsDeleted } from '@/lib/profile-lifecycle';
import { isOwnerMasterSession } from '@/lib/access';
import { teamMemberForUser } from '@/lib/master-team';

export const dynamic='force-dynamic';

export default async function Panel({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const sp=await searchParams;
  const registered=String(sp.registered||'')==='1';
  const suffix=registered?'?registered=1':'';
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const sessionEmail=String((session.user as any).email||'').toLowerCase();
  if(await profileIsDeleted(sessionEmail)) redirect('/cuenta/eliminada');
  if(await isOwnerMasterSession() || await teamMemberForUser({id:String(session.user.id),email:String((session.user as any).email||'')})){
    if(sql){
      const masterRows=await sql`SELECT must_change_password FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
      if(Boolean((masterRows[0] as any)?.must_change_password)) redirect('/cuenta/seguridad');
    }
    redirect('/master');
  }

  let role='PATIENT';
  if(sql){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    role=String((rows[0] as any)?.role||'PATIENT');
  }
  if(role==='DOCTOR') redirect('/medico'+suffix);
  if(role==='CLINIC_ADMIN'||role==='RECEPTION') redirect('/recepcion'+suffix);
  if(role==='MASTER') redirect('/cuenta/seguridad');
  redirect('/paciente'+suffix);
}
