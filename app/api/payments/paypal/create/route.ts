import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/clients/route';
import { planFromType } from '@/lib/plans';

async function token(){
 const id=process.env.PAYPAL_CLIENT_ID, secret=process.env.PAYPAL_CLIENT_SECRET;
 if(!id||!secret) throw new Error('PAYPAL_NOT_CONFIGURED');
 const base=process.env.PAYPAL_BASE_URL||'https://api-m.sandbox.paypal.com';
 const r=await fetch(`${base}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',cache:'no-store'});
 if(!r.ok) throw new Error('PAYPAL_AUTH_FAILED'); const j=await r.json(); return {access:j.access_token,base};
}
export async function POST(req:Request){
 try{
  const {clientId}=await req.json(); const c=getClient(clientId); if(!c)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const plan=planFromType(c.type); const {access,base}=await token(); const appUrl=process.env.APP_URL||new URL(req.url).origin;
  const r=await fetch(`${base}/v2/checkout/orders`,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{reference_id:c.id,description:`TURNAVIA - ${c.name} - activación + primer mes`,amount:{currency_code:'USD',value:plan.initial.toFixed(2)}}],payment_source:{paypal:{experience_context:{return_url:`${appUrl}/pago/paypal/retorno?client=${encodeURIComponent(c.id)}`,cancel_url:`${appUrl}/pago?client=${encodeURIComponent(c.id)}&cancel=1`,user_action:'PAY_NOW'}}}}),cache:'no-store'});
  const data=await r.json(); if(!r.ok)return NextResponse.json({error:'PayPal no pudo crear la orden',details:data},{status:502});
  c.paymentMethod='PAYPAL'; c.paypalOrderId=data.id; c.status='PAGO_PENDIENTE';
  const approve=data.links?.find((x:any)=>x.rel==='payer-action'||x.rel==='approve')?.href;
  return NextResponse.json({ok:true,orderId:data.id,approveUrl:approve});
 }catch(e:any){ if(e.message==='PAYPAL_NOT_CONFIGURED')return NextResponse.json({error:'PayPal todavía no tiene credenciales configuradas en .env.local',code:'PAYPAL_NOT_CONFIGURED'},{status:503}); return NextResponse.json({error:'Error iniciando PayPal',details:e.message},{status:500}); }
}
