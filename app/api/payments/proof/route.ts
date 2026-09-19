import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isMasterSession } from '@/lib/access';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'Acceso restringido'},{status:403});
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
