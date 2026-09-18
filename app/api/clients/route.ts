import { NextResponse } from 'next/server';
import { planFromType } from '@/lib/plans';
import { clients, type Client } from '@/lib/client-store';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';

export async function GET(req:Request){
  const currentTime=Date.now();
  for(const c of clients){
    if(c.status==='TRIAL' && c.trialEndsAt && new Date(c.trialEndsAt).getTime()<currentTime){
      c.status='PAGO_PENDIENTE';
    }
  }
  const url = new URL(req.url);
  const id=url.searchParams.get('id');
  if(id){
    const client=clients.find(c=>c.id===id);
    return client
      ? NextResponse.json({client})
      : NextResponse.json({error:'Cliente no encontrado'},{status:404});
  }
  return NextResponse.json({clients});
}

export async function POST(req:Request){
  const body=await req.json();
  const plan=planFromType(body.type||'Médico independiente');
  const createdAt=new Date();
  const trialEndsAt=new Date(createdAt.getTime()+plan.trialDays*86400000);
  const item:Client={
    id:crypto.randomUUID(),
    name:body.name,
    type:body.type,
    specialty:body.specialty,
    phone:body.phone,
    email:body.email,
    status:'TRIAL',
    createdAt:createdAt.toISOString(),
    trialEndsAt:trialEndsAt.toISOString()
  };
  clients.unshift(item);
  return NextResponse.json({ok:true,client:item,plan},{status:201});
}

export async function PATCH(req:Request){
  const body=await req.json();
  const client=clients.find(c=>c.id===body.id);
  if(!client) return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const previousStatus=client.status;
  if(body.status) client.status=body.status;
  if(body.paymentMethod) client.paymentMethod=body.paymentMethod;
  if(body.paymentReference) client.paymentReference=body.paymentReference;
  if(body.paymentComment) client.paymentComment=body.paymentComment;
  if(body.paypalOrderId) client.paypalOrderId=body.paypalOrderId;
  if(body.status==='ACTIVO' && previousStatus!=='ACTIVO'){
    await sendTransactionalEmail({to:client.email,subject:'Pago aprobado - TURNAVIA',html:turnaviaEmail('Tu cuenta TURNAVIA está activa',`<p>Hola <strong>${client.name}</strong>.</p><p>Tu pago fue revisado y aprobado.</p><p>Ya puedes ingresar y continuar usando TURNAVIA.</p><p><a href="${process.env.APP_URL||'https://turnavia.vercel.app'}/ingresar">Ingresar a TURNAVIA</a></p>`)});
  }
  return NextResponse.json({ok:true,client});
}
