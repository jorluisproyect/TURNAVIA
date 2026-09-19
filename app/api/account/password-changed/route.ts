import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

export async function POST(){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  await sql`UPDATE app_user_profiles SET must_change_password=false,updated_at=now() WHERE auth_user_id=${String(session.user.id)}`;
  return NextResponse.json({ok:true});
}
