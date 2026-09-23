import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { MASTER_EMAIL } from '@/lib/access';
import { MASTER_TEAM_ROLES, validPendingInvitation } from '@/lib/master-team';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  const url=new URL(req.url),email=String(url.searchParams.get('email')||'').toLowerCase(),token=String(url.searchParams.get('invite')||'');
  const invite=await validPendingInvitation(email,token);
  if(!invite)return NextResponse.json({error:'Invitación caducada, usada o no válida.'},{status:404});
  return NextResponse.json({email:invite.email,name:invite.name,roleLabel:MASTER_TEAM_ROLES[invite.role]});
}

export async function POST(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user)return NextResponse.json({error:'Debes iniciar sesión con el correo invitado.'},{status:401});
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL)return NextResponse.json({error:'El propietario ya es Master.'},{status:409});
  const body=await req.json(),token=String(body.invite||'');
  const invite=await validPendingInvitation(email,token);
  if(!invite)return NextResponse.json({error:'Esta invitación no corresponde a tu cuenta, caducó o ya fue usada.'},{status:403});
  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('MASTER_TEAM_ACCEPTED','MASTER_TEAM',${email},
    jsonb_build_object('name',${invite.name},'role',${invite.role},'authUserId',${String(session.user.id)}))`;
  return NextResponse.json({ok:true,roleLabel:MASTER_TEAM_ROLES[invite.role]});
}
