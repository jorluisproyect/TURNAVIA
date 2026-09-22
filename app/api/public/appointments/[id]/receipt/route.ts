import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { buildAppointmentReceiptPdf } from '@/lib/appointment-receipt';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {id}=await ctx.params;
  const token=String(new URL(req.url).searchParams.get('token')||'');
  if(!token)return NextResponse.json({error:'Token requerido'},{status:400});
  const rows=await sql`SELECT status FROM appointments WHERE id=${id}::uuid AND checkin_token=${token} LIMIT 1`;
  const r=rows[0] as any;
  if(!r)return NextResponse.json({error:'Reserva no encontrada'},{status:404});
  if(!['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(String(r.status))){
    return NextResponse.json({error:'El recibo se habilita cuando la reserva está confirmada.'},{status:409});
  }
  const {buffer,data}=await buildAppointmentReceiptPdf(id);
  return new NextResponse(new Uint8Array(buffer),{headers:{
    'Content-Type':'application/pdf',
    'Content-Disposition':`inline; filename="${String(data.receipt_number||'recibo-tucita')}.pdf"`,
    'Cache-Control':'private, no-store'
  }});
}
