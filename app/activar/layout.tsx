import { isMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';

export default async function ActivarLayout({children}:{children:React.ReactNode}){
  if(!(await isMasterSession())) redirect('/panel');
  return children;
}
