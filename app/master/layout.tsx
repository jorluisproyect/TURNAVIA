import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';

export default async function MasterLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  if(!sql) redirect('/ingresar');
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  if(String((rows[0] as any)?.role)!=='MASTER') redirect('/panel');
  return children;
}
