import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';

export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {id}=await ctx.params;
  const token=String(new URL(req.url).searchParams.get('token')||'');
  if(!token)return NextResponse.json({error:'Token requerido'},{status:400});
  const rows=await sql`SELECT status,receipt_number,payment_approved_at,checked_in_at,completed_at
    FROM appointments WHERE id=${id}::uuid AND checkin_token=${token} LIMIT 1`;
  const r=rows[0] as any;
  if(!r)return NextResponse.json({error:'Reserva no encontrada'},{status:404});
  return NextResponse.json({
    status:r.status,
    receiptNumber:r.receipt_number||'',
    paymentApprovedAt:r.payment_approved_at?new Date(r.payment_approved_at).toISOString():null,
    checkedInAt:r.checked_in_at?new Date(r.checked_in_at).toISOString():null,
    completedAt:r.completed_at?new Date(r.completed_at).toISOString():null,
    receiptUrl:['CONFIRMED','ON_THE_WAY','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(String(r.status))
      ? `/api/public/appointments/${id}/receipt?token=${encodeURIComponent(token)}`
      : null
  });
}
