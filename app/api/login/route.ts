import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { MASTER_EMAIL } from '@/lib/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const PUBLIC_APP_URL=(process.env.APP_URL||'https://tucita.com.ve').replace(/\/$/,'');
function requestBaseUrl(req:NextRequest){
  const host=req.nextUrl.hostname.toLowerCase();
  if(process.env.VERCEL_ENV==='preview'&&host.endsWith('.vercel.app')){
    return req.nextUrl.origin;
  }
  return PUBLIC_APP_URL;
}
function publicUrl(req:NextRequest,path:string){return new URL(path,requestBaseUrl(req));}
function loginRedirect(req:NextRequest,error:string){
  const url=publicUrl(req,'/ingresar');
  url.searchParams.set('error',error);
  return NextResponse.redirect(url,303);
}

export async function POST(req:NextRequest){
  try{
    const form=await req.formData();
    const email=String(form.get('email')||'').trim().toLowerCase();
    const password=String(form.get('password')||'');
    const requestedNext=String(form.get('next')||'');

    if(!email||!password) return loginRedirect(req,'credentials');

    const {error}=await auth.signIn.email({email,password});
    if(error) return loginRedirect(req,'credentials');

    if(sql){
      const authRows=await sql`SELECT id,name,email FROM neon_auth.user WHERE lower(email)=lower(${email}) LIMIT 1`;
      const u=authRows[0] as any;
      if(u){
        let role='PATIENT';
        if(email===MASTER_EMAIL) role='MASTER';
        else{
          const existing=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(u.id)} LIMIT 1`;
          if(existing.length) role=String((existing[0] as any).role||'PATIENT');
          else{
            const internal=await sql`SELECT role FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
            if(internal.length) role=String((internal[0] as any).role||'PATIENT');
          }
        }

        await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email)
          VALUES(${String(u.id)},${role}::user_role,${String(u.name||email)},${email})
          ON CONFLICT(auth_user_id) DO UPDATE SET
            role=CASE WHEN lower(EXCLUDED.email)=lower(${MASTER_EMAIL}) THEN 'MASTER'::user_role ELSE app_user_profiles.role END,
            full_name=COALESCE(app_user_profiles.full_name,EXCLUDED.full_name),
            email=EXCLUDED.email,
            updated_at=now()`;
      }
    }

    const next=requestedNext.startsWith('/equipo/aceptar?invite=') && requestedNext.length<500 && !/[\r\n]/.test(requestedNext)
      ? requestedNext
      : '/panel';

    return NextResponse.redirect(publicUrl(req,next),303);
  }catch(error){
    console.error('TUCITA /api/login error',error);
    return loginRedirect(req,'server');
  }
}
