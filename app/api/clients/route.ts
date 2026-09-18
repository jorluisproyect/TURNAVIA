import { NextResponse } from 'next/server';
import { planFromType } from '@/lib/plans';

type ClientStatus = 'TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';
type Client = {
  id:string; name:string; type:string; specialty?:string; phone:string; email:string;
  status:ClientStatus; createdAt:string; trialEndsAt?:string; paymentMethod?:'PAYPAL'|'BINANCE';
  paymentReference?:string; paymentComment?:string; paypalOrderId?:string;
};

declare global { var __turnaviaClients: Client[] | undefined }
const now = new Date();
const trial = new Date(now.getTime()+5*86400000).toISOString();
const clients = globalThis.__turnaviaClients ?? [
 {id:'c1',name:'Centro Médico Caracas',type:'Clínica / consultorio',phone:'0212-5550000',email:'demo@turnavia.app',status:'ACTIVO',createdAt:now.toISOString()},
 {id:'c2',name:'Dra. Sofía Mendoza',type:'Médico independiente',specialty:'Cardiología',phone:'0412-5550101',email:'sofia.demo@turnavia.app',status:'ACTIVO',createdAt:now.toISOString()},
 {id:'trial-demo',name:'Dr. Andrés Rivas',type:'Médico independiente',specialty:'Pediatría',phone:'0412-0000000',email:'andres@demo.turnavia.app',status:'TRIAL',createdAt:now.toISOString(),trialEndsAt:trial},
];
if(!globalThis.__turnaviaClients) globalThis.__turnaviaClients=clients;

function getClients(){ return clients }
function getClient(id:string){ return clients.find(c=>c.id===id) }

export async function GET(req:Request){
  const now=Date.now();
  for(const c of clients){ if(c.status==='TRIAL' && c.trialEndsAt && new Date(c.trialEndsAt).getTime()<now) c.status='PAGO_PENDIENTE'; }
  const url = new URL(req.url); const id=url.searchParams.get('id');
  if(id){ const client=getClient(id); return client?NextResponse.json({client}):NextResponse.json({error:'Cliente no encontrado'},{status:404}); }
  return NextResponse.json({clients:getClients()});
}
export async function POST(req:Request){
  const body=await req.json(); const plan=planFromType(body.type||'Médico independiente');
  const createdAt=new Date(); const trialEndsAt=new Date(createdAt.getTime()+plan.trialDays*86400000);
  const item:Client={id:crypto.randomUUID(),name:body.name,type:body.type,specialty:body.specialty,phone:body.phone,email:body.email,status:'TRIAL',createdAt:createdAt.toISOString(),trialEndsAt:trialEndsAt.toISOString()};
  clients.unshift(item); return NextResponse.json({ok:true,client:item,plan},{status:201});
}
export async function PATCH(req:Request){
  const body=await req.json(); const c=getClient(body.id); if(!c)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  if(body.status)c.status=body.status; if(body.paymentMethod)c.paymentMethod=body.paymentMethod;
  if(body.paymentReference)c.paymentReference=body.paymentReference; if(body.paymentComment)c.paymentComment=body.paymentComment;
  if(body.paypalOrderId)c.paypalOrderId=body.paypalOrderId;
  return NextResponse.json({ok:true,client:c});
}
