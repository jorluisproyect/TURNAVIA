import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user) return NextResponse.json({error:'No autorizado'},{status:401});
  const email=String((session.user as any).email||'').toLowerCase();
  const profile=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  if(email!=='jorgeluisananguren@gmail.com' && String((profile[0] as any)?.role)!=='MASTER') return NextResponse.json({error:'Acceso restringido'},{status:403});
  const id=new URL(req.url).searchParams.get('id');
  if(!id) return NextResponse.json({error:'Falta el cliente'},{status:400});
  const rows=await sql`SELECT payment_proof,payment_proof_name,payment_proof_mime FROM commercial_clients WHERE id=${id}::uuid LIMIT 1`;
  const r=rows[0] as any;
  if(!r?.payment_proof) return NextResponse.json({error:'Comprobante no encontrado'},{status:404});
  const body=Buffer.from(r.payment_proof);
  return new NextResponse(body,{headers:{
    'Content-Type':r.payment_proof_mime||'application/octet-stream',
    'Content-Disposition':`inline; filename="${String(r.payment_proof_name||'comprobante').replace(/"/g,'')}"`,
    'Cache-Control':'private, no-store'
  }});
}
