import { isOwnerMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default async function OwnerTeamLayout({children}:{children:React.ReactNode}){
  if(!(await isOwnerMasterSession()))redirect('/master');
  return children;
}
