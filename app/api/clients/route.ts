import { NextResponse } from 'next/server';
import { planFromType } from '@/lib/plans';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';
import { isMasterSession, commercialClientAccess } from '@/lib/access';

function mapClient(r:any){
  return {
    id:String(r.id),name:r.name,type:r.type,category:r.category||'',subcategory:r.subcategory||'',specialty:r.specialty||'',phone:r.phone||'',email:r.email,
    status:r.status,createdAt:r.created_at?new Date(r.created_at).toISOString():undefined,
    trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,
    paymentMethod:r.payment_method||undefined,paymentReference:r.payment_reference||undefined,
    paymentComment:r.payment_comment||undefined,paypalOrderId:r.paypal_order_id||undefined,hasProof:Boolean(r.payment_proof),paymentSubmittedAt:r.payment_submitted_at?new Date(r.payment_submitted_at).toISOString():undefined,paymentReviewedAt:r.payment_reviewed_at?new Date(r.payment_reviewed_at).toISOString():undefined,paymentRejectionReason:r.payment_rejection_reason||undefined
  };
}

export async function GET(req:Request){
  if(!sql) return NextResponse.json({clients:[]});
  await sql`UPDATE commercial_clients SET status='PAGO_PENDIENTE' WHERE status='TRIAL' AND trial_ends_at IS NOT NULL AND trial_ends_at < now()`;
  const url=new URL(req.url);
  const id=url.searchParams.get('id');
  if(id){
    const access=await commercialClientAccess(id);
    if(!access.client) return NextResponse.json({error:'Cliente no encontrado'},{status:404});
    if(!access.allowed) return NextResponse.json({error:'No autorizado'},{status:403});
    const x=mapClient(access.client);
    return NextResponse.json({client:{id:x.id,name:x.name,type:x.type,category:x.category,subcategory:x.subcategory,status:x.status,trialEndsAt:x.trialEndsAt,paymentSubmittedAt:x.paymentSubmittedAt,paymentReviewedAt:x.paymentReviewedAt,paymentRejectionReason:x.paymentRejectionReason}});
  }
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});
  const rows=await sql`SELECT * FROM commercial_clients ORDER BY created_at DESC`;
  return NextResponse.json({clients:rows.map(mapClient)});
}

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});
  const body=await req.json();
  const plan=planFromType(body.type||'Médico independiente');
  const existing=await sql`SELECT * FROM commercial_clients WHERE lower(email)=lower(${body.email}) ORDER BY created_at DESC LIMIT 1`;
  if(existing.length) return NextResponse.json({ok:true,client:mapClient(existing[0]),plan});
  const rows=await sql`INSERT INTO commercial_clients(name,type,category,subcategory,specialty,phone,email,status,trial_ends_at)
    VALUES(${body.name},${body.type||'Profesional independiente'},${body.category||null},${body.subcategory||null},${body.specialty||null},${body.phone||null},${body.email},'TRIAL',now()+${plan.trialDays}*interval '1 day')
    RETURNING *`;
  return NextResponse.json({ok:true,client:mapClient(rows[0]),plan},{status:201});
}

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});
  const body=await req.json();
  const before=await sql`SELECT * FROM commercial_clients WHERE id=${body.id}::uuid LIMIT 1`;
  if(!before.length) return NextResponse.json({error:'Cliente no encontrado'},{status:404});
  const prev=before[0] as any;
  const rows=await sql`UPDATE commercial_clients SET
    status=COALESCE(${body.status||null},status),
    payment_method=COALESCE(${body.paymentMethod||null},payment_method),
    payment_reference=COALESCE(${body.paymentReference||null},payment_reference),
    payment_comment=COALESCE(${body.paymentComment||null},payment_comment),
    paypal_order_id=COALESCE(${body.paypalOrderId||null},paypal_order_id),
    payment_reviewed_at=CASE WHEN ${body.status||null} IN ('ACTIVO','PAGO_PENDIENTE') THEN now() ELSE payment_reviewed_at END,
    payment_rejection_reason=CASE WHEN ${body.status||null}='PAGO_PENDIENTE' THEN ${body.rejectionReason||'Pago rechazado. Verifica los datos e intenta nuevamente.'} ELSE payment_rejection_reason END
    WHERE id=${body.id}::uuid RETURNING *`;
  const client=mapClient(rows[0]);
  const updatedRow=rows[0] as any;
  if(body.status && body.status!==prev.status){
    try{
      const authUserId=String(updatedRow.auth_user_id||'');
      if(authUserId){
        if(body.status==='ACTIVO'){
          await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
            VALUES(${authUserId},'SUCCESS','Cuenta TURNAVIA activa','Tu pago fue aprobado. Tu cuenta ya está activa y puedes continuar configurando y operando TURNAVIA.','/panel')`;
        }else if(body.status==='PAGO_PENDIENTE' && body.rejectionReason){
          await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
            VALUES(${authUserId},'WARNING','Pago rechazado',${'Tu pago necesita corrección: '+String(body.rejectionReason||'Verifica los datos e intenta nuevamente.')},${'/pago?client='+String(client.id)})`;
        }else if(body.status==='SUSPENDIDO'){
          await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
            VALUES(${authUserId},'WARNING','Cuenta suspendida','Tu cuenta TURNAVIA fue suspendida. Revisa tu suscripción o contacta al administrador.','/panel')`;
        }else if(body.status==='ACTIVO' && prev.status==='SUSPENDIDO'){
          await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
            VALUES(${authUserId},'SUCCESS','Cuenta reactivada','Tu cuenta TURNAVIA volvió a estar activa.','/panel')`;
        }
      }
    }catch(error){
      console.error('TURNAVIA in-app client notification error',error);
    }
    const action=body.status==='ACTIVO'
      ? (prev.status==='SUSPENDIDO'?'CLIENT_REACTIVATED':'PAYMENT_APPROVED')
      : body.status==='SUSPENDIDO'
        ? 'CLIENT_SUSPENDED'
        : body.status==='PAGO_PENDIENTE' && body.rejectionReason
          ? 'PAYMENT_REJECTED'
          : 'CLIENT_STATUS_CHANGED';
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES(${action},'COMMERCIAL_CLIENT',${String(client.id)},jsonb_build_object(
        'previousStatus',${String(prev.status||'')},
        'nextStatus',${String(body.status||'')},
        'reason',${body.rejectionReason||null},
        'paymentMethod',${client.paymentMethod||null},
        'paymentReference',${client.paymentReference||null}
      ))`;
  }
  if(body.status==='ACTIVO' && prev.status!=='ACTIVO'){
    const appUrl=process.env.APP_URL||'https://turnavia.vercel.app';
    const linkRows=await sql`SELECT d.public_slug,o.slug AS organization_slug
      FROM users u
      JOIN doctors d ON d.user_id=u.id
      LEFT JOIN organizations o ON o.id=u.organization_id
      WHERE lower(u.email)=lower(${client.email})
      ORDER BY u.created_at
      LIMIT 1`;
    const linkRow=linkRows[0] as any;
    const publicPath=linkRow?.organization_slug?'/negocio/'+linkRow.organization_slug:linkRow?.public_slug?'/reservar/'+linkRow.public_slug:'';
    const activationMail=await sendTransactionalEmail({to:client.email,subject:'Pago aprobado - TURNAVIA',html:turnaviaEmail('Tu cuenta TURNAVIA está activa',`<p>Hola <strong>${client.name}</strong>.</p><p>Tu pago fue revisado y aprobado. Tu cuenta ya está activa.</p>${publicPath?`<p><strong>Tu enlace público personalizado:</strong><br/><a href="${appUrl}${publicPath}">${appUrl}${publicPath}</a></p><p>Compártelo con tus clientes para recibir reservas.</p>`:''}<p><a href="${appUrl}/ingresar">Ingresar a TURNAVIA</a></p>`)});
    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(${activationMail.ok?'ACTIVATION_EMAIL_SENT':'ACTIVATION_EMAIL_FAILED'},'COMMERCIAL_CLIENT',${String(client.id)},jsonb_build_object('to',${client.email},'error',${activationMail.error||null}))`;
    }catch(error){console.error('TURNAVIA activation email audit error',error)}
  }
  return NextResponse.json({ok:true,client});
}
