import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { commercialClientAccess, MASTER_EMAIL } from '@/lib/access';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';
import { billingAmount, type BillingCycleMonths } from '@/lib/plans';

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
  const rawCycle=Number(form.get('billingCycleMonths')||1);
  const billingCycleMonths=([1,3,12].includes(rawCycle)?rawCycle:1) as BillingCycleMonths;
  const proof=form.get('proof');
  if(!reference) return NextResponse.json({error:'Indica la referencia o ID de transacción'},{status:400});
  const methodRows=paymentMethodId
    ? await sql`SELECT id,name,type,requires_proof FROM payment_methods WHERE id=${paymentMethodId}::uuid AND scope='MASTER' AND active=true LIMIT 1`
    : await sql`SELECT id,name,type,requires_proof FROM payment_methods WHERE scope='MASTER' AND active=true AND upper(type)=upper(${paymentMethod}) ORDER BY is_primary DESC,created_at LIMIT 1`;
  const selectedMethod=methodRows[0] as any;
  if(!selectedMethod) return NextResponse.json({error:'Método de pago no disponible'},{status:409});
  const methodLabel=String(selectedMethod.type||selectedMethod.name||paymentMethod).toUpperCase();
  const requiresProof=selectedMethod.requires_proof!==false;
  if(requiresProof && (!(proof instanceof File) || proof.size===0)) return NextResponse.json({error:'Adjunta el comprobante del pago'},{status:400});
  if(proof instanceof File && proof.size>5*1024*1024) return NextResponse.json({error:'El comprobante debe pesar máximo 5 MB'},{status:400});
  const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
  if(proof instanceof File && proof.size>0 && !allowed.includes(proof.type)) return NextResponse.json({error:'Formato de comprobante no permitido'},{status:400});
  const bytes=proof instanceof File && proof.size>0 ? Buffer.from(await proof.arrayBuffer()) : null;
  const rows=await sql`UPDATE commercial_clients
    SET payment_method=${methodLabel},
        payment_reference=${reference},
        payment_comment=${comment||null},
        payment_proof=${bytes},
        payment_proof_name=${proof instanceof File?proof.name:null},
        payment_proof_mime=${proof instanceof File?proof.type:null},
        payment_submitted_at=now(),
        payment_rejection_reason=NULL,
        status='REVISION_BINANCE'
    WHERE id=${clientId}::uuid RETURNING *`;
  if(!rows.length)return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const r=rows[0] as any;
  const amount=billingAmount(String(r.type||''),billingCycleMonths,Boolean((access.client as any)?.payment_reviewed_at));
  try{
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES('PAYMENT_SUBMITTED','COMMERCIAL_CLIENT',${clientId},jsonb_build_object('source','TUCITA_SUBSCRIPTION','method',${methodLabel},'reference',${reference},'amount',${amount},'currency','USD','billingMonths',${billingCycleMonths}))`;
  }catch(error){
    console.error('TUCITA payment audit error',error);
  }

  try{
    if(r.auth_user_id){
      await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
        VALUES(${String(r.auth_user_id)},'PAYMENT','Pago enviado','Recibimos tu pago y está esperando aprobación del administrador de TUCITA.','/panel')`;
    }
    const masterRows=await sql`SELECT auth_user_id FROM app_user_profiles WHERE role='MASTER' ORDER BY updated_at DESC LIMIT 1`;
    const masterAuthId=String((masterRows[0] as any)?.auth_user_id||'');
    if(masterAuthId){
      await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
        VALUES(${masterAuthId},'PAYMENT','Nuevo pago por revisar',${r.name+' envió un pago por '+methodLabel+' · Ref. '+reference},'/master')`;
    }
  }catch(error){
    console.error('TUCITA in-app payment notification error',error);
  }

  const masterMail=await sendTransactionalEmail({
    to:MASTER_EMAIL,
    subject:'Nuevo pago TUCITA por revisar',
    html:tucitaEmail('Pago pendiente de verificación',`<p><strong>${r.name}</strong> envió un pago de TUCITA.</p><p><strong>Método:</strong> ${methodLabel}<br/><strong>Referencia:</strong> ${reference}<br/><strong>Período:</strong> ${billingCycleMonths===12?'1 año':billingCycleMonths+' mes'+(billingCycleMonths===1?'':'es')}<br/><strong>Monto:</strong> USD ${amount}</p><p>Ingresa al Panel Master para revisar el comprobante y aprobar o rechazar el pago.</p><p><a href="${process.env.APP_URL||'https://tucita.com.ve'}/master">Abrir Panel Master</a></p>`)
  });
  let clientMail:any={ok:false,skipped:true};
  if(r.email){
    clientMail=await sendTransactionalEmail({
      to:r.email,
      subject:'Recibimos tu pago TUCITA',
      html:tucitaEmail('Pago recibido',`<p>Hola <strong>${r.name}</strong>.</p><p>Recibimos tu referencia y comprobante. El pago está en revisión y te avisaremos cuando sea aprobado.</p>`)
    });
  }

  try{
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES('PAYMENT_EMAIL_STATUS','COMMERCIAL_CLIENT',${clientId},jsonb_build_object(
        'masterOk',${Boolean(masterMail.ok)},
        'clientOk',${Boolean(clientMail.ok)},
        'clientError',${clientMail.error||null}
      ))`;
  }catch(error){
    console.error('TUCITA payment email audit error',error);
  }

  return NextResponse.json({ok:true,emailNotice:clientMail.ok?'sent':'pending',client:{id:String(r.id),name:r.name,type:r.type,specialty:r.specialty||'',phone:r.phone||'',email:r.email,status:r.status,trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,paymentMethod:r.payment_method,paymentReference:r.payment_reference,paymentComment:r.payment_comment,hasProof:Boolean(r.payment_proof)}});
}
