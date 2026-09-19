import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { MASTER_EMAIL } from '@/lib/access';

export const dynamic='force-dynamic';

export default async function MasterLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');

  const sessionEmail=String((session.user as any).email||'').toLowerCase();
  if(!sql) redirect('/ingresar');
  const rows=await sql`SELECT role,must_change_password FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  const profile=rows[0] as any;
  if(sessionEmail!==MASTER_EMAIL && String(profile?.role)!=='MASTER') redirect('/panel');
  if(Boolean(profile?.must_change_password)) redirect('/cuenta/seguridad');
  return children;
}
