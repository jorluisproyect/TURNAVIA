import { NextResponse } from 'next/server';
import { sql,hasDatabase,databaseEnvName } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(){
  let databaseReachable=false;
  let databaseError='';
  if(sql){
    try{
      const rows=await sql`SELECT 1 AS ok`;
      databaseReachable=Number((rows[0] as any)?.ok||0)===1;
    }catch(error){
      databaseError=error instanceof Error?error.message:'Database connection failed';
    }
  }

  return NextResponse.json({
    ok:databaseReachable && Boolean(process.env.NEON_AUTH_COOKIE_SECRET),
    app:'TUCITA',
    database:{configured:hasDatabase,reachable:databaseReachable,env:databaseEnvName,error:process.env.NODE_ENV==='production'?undefined:(databaseError||undefined)},
    auth:{baseUrlConfigured:Boolean(process.env.NEON_AUTH_BASE_URL)||true,cookieSecretConfigured:Boolean(process.env.NEON_AUTH_COOKIE_SECRET)},
    appUrlConfigured:Boolean(process.env.APP_URL),
    emailConfigured:Boolean(process.env.RESEND_API_KEY),
    timestamp:new Date().toISOString()
  });
}
