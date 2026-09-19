import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const MASTER_EMAIL=(process.env.MASTER_EMAIL||'jorgeluisananguren@gmail.com').toLowerCase();

export async function currentSession(){
  const {data:session}=await auth.getSession();
  return session||null;
}

export async function isMasterSession(){
  const session=await currentSession();
  if(!session?.user) return false;
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL) return true;
  if(!sql) return false;
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  return String((rows[0] as any)?.role||'')==='MASTER';
}

export async function commercialClientAccess(clientId:string){
  if(!sql) return {allowed:false,master:false,session:null,client:null as any};
  const session=await currentSession();
  if(!session?.user) return {allowed:false,master:false,session:null,client:null as any};
  const email=String((session.user as any).email||'').toLowerCase();
  const master=email===MASTER_EMAIL || String(((await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`)[0] as any)?.role||'')==='MASTER';
  const rows=await sql`SELECT * FROM commercial_clients WHERE id=${clientId}::uuid LIMIT 1`;
  const client=(rows[0] as any)||null;
  if(!client) return {allowed:false,master,session,client:null as any};
  const owner=String(client.auth_user_id||'')===String(session.user.id) || String(client.email||'').toLowerCase()===email;
  return {allowed:master||owner,master,session,client};
}
