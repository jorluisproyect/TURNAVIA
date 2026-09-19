import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export const dynamic='force-dynamic';

export default async function CuentaLayout({children}:{children:React.ReactNode}){
  const {data:session}=await auth.getSession();
  if(!session?.user) redirect('/ingresar');
  return children;
}
