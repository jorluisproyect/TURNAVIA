import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';
const MASTER_EMAIL='jorgeluisananguren@gmail.com';

export default async function MasterLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');

  const sessionEmail=String((session.user as any).email||'').toLowerCase();
  if(sessionEmail===MASTER_EMAIL) return children;

  if(!sql) redirect('/ingresar');
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  if(String((rows[0] as any)?.role)!=='MASTER') redirect('/panel');
  return children;
}
