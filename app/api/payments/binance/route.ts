import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {clientId,reference,comment,paymentMethod}=await req.json();
  if(!reference)return NextResponse.json({error:'Indica la referencia o ID de transacción'},{status:400});
  const method=paymentMethod==='PAYPAL'?'PAYPAL':'BINANCE';
  const rows=await sql`UPDATE commercial_clients
    SET payment_method=${method},payment_reference=${reference},payment_comment=${comment||null},status='REVISION_BINANCE'
    WHERE id=${clientId}::uuid RETURNING *`;
  if(!rows.length)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const r=rows[0] as any;
  return NextResponse.json({ok:true,client:{id:String(r.id),name:r.name,type:r.type,specialty:r.specialty||'',phone:r.phone||'',email:r.email,status:r.status,trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,paymentMethod:r.payment_method,paymentReference:r.payment_reference,paymentComment:r.payment_comment}});
}
