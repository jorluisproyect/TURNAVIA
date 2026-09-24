import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!sql)return NextResponse.json({error:'Servicio no disponible.'},{status:503});
  const body=await req.json().catch(()=>({}));
  const slug=String(body.slug||'').trim();
  const reason=String(body.reason||'').trim();
  const email=String(body.email||'').trim().toLowerCase();

  if(!slug||reason.length<10||reason.length>600)return NextResponse.json({error:'Reporte incompleto.'},{status:400});
  if(email&&!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:'Correo inválido.'},{status:400});

  const provider=await sql`SELECT d.id,u.email FROM doctors d JOIN users u ON u.id=d.user_id WHERE d.public_slug=${slug} LIMIT 1`;
  if(!provider.length)return NextResponse.json({error:'Perfil no encontrado.'},{status:404});

  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('PUBLIC_CONTENT_REPORTED','PROVIDER',${String((provider[0] as any).id)},
      jsonb_build_object('slug',${slug},'providerEmail',${String((provider[0] as any).email||'')},'reason',${reason},'reporterEmail',${email||null},'status','OPEN'))`;

  return NextResponse.json({ok:true});
}
