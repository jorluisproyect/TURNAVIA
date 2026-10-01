import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/access';
import { pushConfig, savePushSubscription, deletePushSubscription, sendPushToAuthUser } from '@/lib/push';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  const session=await currentSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});
  return NextResponse.json(pushConfig());
}

export async function POST(req:Request){
  const session=await currentSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});
  const body=await req.json().catch(()=>({}));
  try{
    await savePushSubscription(String(session.user.id),body.subscription);
    return NextResponse.json({ok:true,message:'Notificaciones del teléfono activadas.'});
  }catch(error:any){
    return NextResponse.json({error:String(error?.message||'No se pudo activar la notificación.')},{status:400});
  }
}

export async function PUT(){
  const session=await currentSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});
  const result=await sendPushToAuthUser(String(session.user.id),{
    title:'TUCITA · Notificaciones activas',
    body:'Tu teléfono ya puede recibir recordatorios y avisos de TUCITA.',
    url:'/master'
  });
  return NextResponse.json(result);
}

export async function DELETE(req:Request){
  const session=await currentSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});
  const body=await req.json().catch(()=>({}));
  const endpoint=String(body.endpoint||'');
  await deletePushSubscription(String(session.user.id),endpoint);
  return NextResponse.json({ok:true});
}
