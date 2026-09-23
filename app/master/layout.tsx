import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { isMasterSession } from '@/lib/access';

export const dynamic='force-dynamic';

export default async function MasterLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  if(!(await isMasterSession())) redirect('/panel');

  if(sql){
    const rows=await sql`SELECT must_change_password FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    if(Boolean((rows[0] as any)?.must_change_password)) redirect('/cuenta/seguridad');
  }
  return children;
}
