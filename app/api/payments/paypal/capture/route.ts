import { NextResponse } from 'next/server';

export const dynamic='force-dynamic';

export async function POST(){
  return NextResponse.json({
    error:'El PayPal automático está temporalmente deshabilitado mientras se migra al flujo persistente de TUCITA.',
    code:'PAYPAL_AUTOMATIC_DISABLED',
    useManualPayment:true
  },{status:503});
}
