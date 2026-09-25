import BookingClient from './BookingClient';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';

export const dynamic='force-dynamic';

export default async function BookingPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  let patientLoggedIn=false;
  try{
    const {data:session}=await auth.getSession();
    if(session?.user&&sql){
      const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
      patientLoggedIn=String((rows[0] as any)?.role||'')==='PATIENT';
    }
  }catch{}

  const content=<main className={patientLoggedIn?'main':undefined}><BookingClient slug={slug} patientLoggedIn={patientLoggedIn}/></main>;
  return patientLoggedIn?<div className="dashboard"><Sidebar role="paciente"/>{content}</div>:content;
}
