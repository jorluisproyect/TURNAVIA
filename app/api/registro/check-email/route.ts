import { NextResponse } from 'next/server';
import { existingAccountKind, existingAccountMessage } from '@/lib/account-availability';

export const dynamic='force-dynamic';

export async function POST(req:Request){
  let body:any;
  try{body=await req.json()}catch{return NextResponse.json({error:'Solicitud inválida.'},{status:400})}
  const email=String(body?.email||'').trim().toLowerCase();
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)){
    return NextResponse.json({error:'Escribe un correo válido.'},{status:400});
  }
  try{
    const kind=await existingAccountKind(email);
    if(kind===undefined)return NextResponse.json({error:'No se pudo verificar el correo en este momento.'},{status:503});
    return NextResponse.json({available:!kind,accountType:kind||null,message:kind?existingAccountMessage(kind):'Correo disponible para tu cuenta TUCITA.'});
  }catch{
    return NextResponse.json({error:'No se pudo verificar el correo. Intenta de nuevo.'},{status:503});
  }
}
