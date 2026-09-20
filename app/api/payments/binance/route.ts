import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commercialClientAccess, MASTER_EMAIL } from '@/lib/access';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const form=await req.formData();
  const clientId=String(form.get('clientId')||'');
  const access=await commercialClientAccess(clientId);
  if(!access.client) return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  if(!access.allowed) return NextResponse.json({error:'No autorizado'},{status:403});
  const reference=String(form.get('reference')||'').trim();
  const comment=String(form.get('comment')||'');
  const paymentMethod=String(form.get('paymentMethod')||'').trim();
  const paymentMethodId=String(form.get('paymentMethodId')||'').trim();
  const proof=form.get('proof');
  if(!reference) return NextResponse.json({error:'Indica la referencia o ID de transacción'},{status:400});
  if(!(proof instanceof File) || proof.size===0) return NextResponse.json({error:'Adjunta el comprobante del pago'},{status:400});
  if(proof.size>5*1024*1024) return NextResponse.json({error:'El comprobante debe pesar máximo 5 MB'},{status:400});
  const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
  if(!allowed.includes(proof.type)) return NextResponse.json({error:'Formato de comprobante no permitido'},{status:400});
  const methodRows=paymentMethodId
    ? await sql`SELECT id,name,type FROM payment_methods WHERE id=${paymentMethodId}::uuid AND scope='MASTER' AND active=true LIMIT 1`
    : await sql`SELECT id,name,type FROM payment_methods WHERE scope='MASTER' AND active=true AND upper(type)=upper(${paymentMethod}) ORDER BY is_primary DESC,created_at LIMIT 1`;
  const selectedMethod=methodRows[0] as any;
  if(!selectedMethod) return NextResponse.json({error:'Método de pago no disponible'},{status:409});
  const methodLabel=String(selectedMethod.type||selectedMethod.name||paymentMethod).toUpperCase();
  const bytes=Buffer.from(await proof.arrayBuffer());
  const rows=await sql`UPDATE commercial_clients
    SET payment_method=${methodLabel},
        payment_reference=${reference},
        payment_comment=${comment||null},
        payment_proof=${bytes},
        payment_proof_name=${proof.name},
        payment_proof_mime=${proof.type},
        payment_submitted_at=now(),
        payment_rejection_reason=NULL,
        status='REVISION_BINANCE'
    WHERE id=${clientId}::uuid RETURNING *`;
  if(!rows.length)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const r=rows[0] as any;
  await sendTransactionalEmail({to:MASTER_EMAIL,subject:'Nuevo pago TURNAVIA por revisar',html:turnaviaEmail('Pago pendiente de verificación',`<p><strong>${r.name}</strong> envió un pago de TURNAVIA.</p><p><strong>Método:</strong> ${methodLabel}<br/><strong>Referencia:</strong> ${reference}</p><p>Ingresa al Panel Master para revisar el comprobante y aprobar o rechazar el pago.</p><p><a href="${process.env.APP_URL||'https://turnavia.vercel.app'}/master">Abrir Panel Master</a></p>`) });
  if(r.email){await sendTransactionalEmail({to:r.email,subject:'Recibimos tu pago TURNAVIA',html:turnaviaEmail('Pago recibido',`<p>Hola <strong>${r.name}</strong>.</p><p>Recibimos tu referencia y comprobante. El pago está en revisión y te avisaremos cuando sea aprobado.</p>`) });}
  return NextResponse.json({ok:true,client:{id:String(r.id),name:r.name,type:r.type,specialty:r.specialty||'',phone:r.phone||'',email:r.email,status:r.status,trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,paymentMethod:r.payment_method,paymentReference:r.payment_reference,paymentComment:r.payment_comment,hasProof:Boolean(r.payment_proof)}});
}
