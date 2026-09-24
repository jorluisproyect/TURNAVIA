import { NextResponse } from 'next/server';
import { isOwnerMasterSession } from '@/lib/access';
import { purgeAccountByEmail } from '@/lib/purge-account';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:Request){
  if(!(await isOwnerMasterSession())){
    return NextResponse.json({error:'Solo el Master propietario puede liberar un correo.'},{status:403});
  }
  const body=await req.json().catch(()=>({}));
  const email=String(body.email||'').trim().toLowerCase();
  const confirmation=String(body.confirmation||'');
  if(confirmation!=='LIBERAR')return NextResponse.json({error:'Confirmación final inválida.'},{status:400});

  try{
    const result=await purgeAccountByEmail(email);
    return NextResponse.json(result);
  }catch(error:any){
    console.error('TUCITA free email error',error);
    return NextResponse.json({
      error:String(error?.message||'No se pudo liberar el correo.').slice(0,600)
    },{status:500});
  }
}
