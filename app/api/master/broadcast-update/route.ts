import { NextResponse } from 'next/server';
import { isOwnerMasterSession } from '@/lib/access';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

export async function POST(req:Request){
  if(!(await isOwnerMasterSession()))return NextResponse.json({error:'Solo Master.'},{status:403});
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});

  const body=await req.json().catch(()=>({}));
  const title=String(body.title||'Actualización TUCITA').trim().slice(0,90)||'Actualización TUCITA';
  const message=String(body.message||'TUCITA fue actualizada con nuevas mejoras. Entra a tu panel para revisarlas.').trim().slice(0,900);
  const link=String(body.link||'/medico').trim().slice(0,300)||'/medico';
  if(!message)return NextResponse.json({error:'Escribe el mensaje de la actualización.'},{status:400});

  const recipients=await sql`SELECT DISTINCT auth_user_id
    FROM app_user_profiles
    WHERE role::text='DOCTOR'
      AND COALESCE(auth_user_id,'')<>''`;

  if(!recipients.length)return NextResponse.json({ok:true,sent:0,message:'No hay profesionales registrados todavía.'});

  await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
    SELECT DISTINCT auth_user_id,'INFO',${title},${message},${link}
    FROM app_user_profiles
    WHERE role::text='DOCTOR'
      AND COALESCE(auth_user_id,'')<>''`;

  return NextResponse.json({
    ok:true,
    sent:recipients.length,
    message:'Actualización enviada a '+recipients.length+' profesional'+(recipients.length===1?'':'es')+'.'
  });
}
