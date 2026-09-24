import { NextResponse } from 'next/server';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { resetTucitaToZero } from '@/lib/master-reset';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:Request){
  if(!(await isOwnerMasterSession())){
    return NextResponse.json({error:'Solo el Master propietario puede reiniciar TUCITA.'},{status:403});
  }

  const body=await req.json().catch(()=>({}));
  const confirmation=String(body.confirmation||'');
  if(!['ELIMINAR TODO','BLANQUEAR TUCITA'].includes(confirmation)){
    return NextResponse.json({error:'Confirmación final inválida.'},{status:400});
  }

  try{
    const counts=await resetTucitaToZero(MASTER_EMAIL);
    return NextResponse.json({
      ok:true,
      message:'TUCITA quedó en cero para comenzar con usuarios reales.',
      counts
    });
  }catch(error:any){
    console.error('TUCITA master reset error',error);
    const raw=String(error?.message||error||'Error desconocido');
    const safe=raw
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi,'[conexion protegida]')
      .replace(/password=[^\s]+/gi,'password=[protegido]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi,'Bearer [protegido]')
      .slice(0,900);

    return NextResponse.json({
      error:'No se pudo completar el reinicio de TUCITA.',
      technicalDetail:safe
    },{status:500});
  }
}
