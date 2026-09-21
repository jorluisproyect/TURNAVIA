import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

export async function GET(){
  if(!sql) return NextResponse.json({notifications:[],unread:0});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const authUserId=String(session.user.id);
  const rows=await sql`SELECT id,type,title,message,link,read_at,created_at
    FROM app_notifications
    WHERE auth_user_id=${authUserId}
    ORDER BY created_at DESC
    LIMIT 30`;
  const unread=(rows as any[]).filter(n=>!n.read_at).length;
  return NextResponse.json({notifications:rows,unread});
}

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const authUserId=String(session.user.id);
  const body=await req.json();
  if(body.all){
    await sql`UPDATE app_notifications SET read_at=COALESCE(read_at,now()) WHERE auth_user_id=${authUserId}`;
    return NextResponse.json({ok:true});
  }
  const id=String(body.id||'');
  if(!id) return NextResponse.json({error:'Notificación inválida'},{status:400});
  await sql`UPDATE app_notifications SET read_at=COALESCE(read_at,now()) WHERE id=${id}::uuid AND auth_user_id=${authUserId}`;
  return NextResponse.json({ok:true});
}
