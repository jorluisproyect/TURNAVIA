import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/clients/route';
async function token(){
 const id=process.env.PAYPAL_CLIENT_ID, secret=process.env.PAYPAL_CLIENT_SECRET; if(!id||!secret)throw new Error('PAYPAL_NOT_CONFIGURED');
 const base=process.env.PAYPAL_BASE_URL||'https://api-m.sandbox.paypal.com';
 const r=await fetch(`${base}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',cache:'no-store'}); const j=await r.json(); return {access:j.access_token,base};
}
export async function POST(req:Request){
 try{
  const {clientId,orderId}=await req.json(); const c=getClient(clientId); if(!c)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  if(c.paypalOrderId!==orderId)return NextResponse.json({error:'La orden no corresponde a esta cuenta'},{status:400});
  const {access,base}=await token(); const r=await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},cache:'no-store'}); const data=await r.json();
  if(!r.ok)return NextResponse.json({error:'No se pudo confirmar el pago',details:data},{status:502});
  if(data.status==='COMPLETED'){c.status='ACTIVO';c.paymentMethod='PAYPAL';}
  return NextResponse.json({ok:data.status==='COMPLETED',status:data.status,client:c});
 }catch(e:any){return NextResponse.json({error:'Error confirmando PayPal',details:e.message},{status:500})}
}
