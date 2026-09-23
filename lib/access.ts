import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const MASTER_EMAIL=(process.env.MASTER_EMAIL||'jorgeluisananguren@gmail.com').toLowerCase();

export function validUuid(value:string){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function currentSession(){
  const {data:session}=await auth.getSession();
  return session||null;
}

export async function isOwnerMasterSession(){
  const session=await currentSession();
  return Boolean(session?.user && String((session.user as any).email||'').toLowerCase()===MASTER_EMAIL);
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
  if(!sql||!validUuid(clientId)) return {allowed:false,master:false,session:null,client:null as any};
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
