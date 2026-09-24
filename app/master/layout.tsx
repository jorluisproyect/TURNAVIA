import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import { isOwnerMasterSession } from '@/lib/access';
import { teamMemberForUser } from '@/lib/master-team';
import MasterRefreshControl from '@/components/MasterRefreshControl';

export const dynamic='force-dynamic';

export default async function MasterLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  const owner=await isOwnerMasterSession();
  if(!owner&&!(await teamMemberForUser({id:String(session.user.id),email:String((session.user as any).email||'')})))redirect('/panel');

  if(sql){
    const rows=await sql`SELECT must_change_password FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    if(Boolean((rows[0] as any)?.must_change_password)) redirect('/cuenta/seguridad');
  }
  return <>{children}<MasterRefreshControl/></>;
}
