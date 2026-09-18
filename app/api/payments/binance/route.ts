import { NextResponse } from 'next/server';
import { getClient } from '@/lib/client-store';

export async function POST(req:Request){
  const {clientId,reference,comment,paymentMethod}=await req.json();
  const c=getClient(clientId);
  if(!c)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  if(!reference)return NextResponse.json({error:'Indica la referencia o ID de transacción'},{status:400});
  c.paymentMethod=paymentMethod==='PAYPAL'?'PAYPAL':'BINANCE';
  c.paymentReference=reference;
  c.paymentComment=comment||`TURNAVIA - ${c.name}`;
  c.status='REVISION_BINANCE';
  return NextResponse.json({ok:true,client:c});
}
