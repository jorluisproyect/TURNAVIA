import { NextResponse } from 'next/server';
import { isMasterSession, MASTER_EMAIL } from '@/lib/access';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';

export const runtime='nodejs';

export async function POST(){
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});
  const result=await sendTransactionalEmail({
    to:MASTER_EMAIL,
    subject:'Prueba de correo TUCITA',
    html:tucitaEmail('Correo de prueba',`<p>Si recibiste este mensaje, los correos transaccionales de TUCITA están funcionando correctamente.</p><p><strong>Destino de prueba:</strong> ${MASTER_EMAIL}</p>`)
  });
  if(!result.ok) return NextResponse.json({error:result.error||'No se pudo enviar el correo.',status:result.status||null},{status:502});
  return NextResponse.json({ok:true,transport:result.transport||null});
}
