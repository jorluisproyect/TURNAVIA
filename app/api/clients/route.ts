import { NextResponse } from 'next/server';
import { planFromType } from '@/lib/plans';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';
import { auth } from '@/lib/auth/server';


const MASTER_EMAIL='jorgeluisananguren@gmail.com';
async function isMaster(){
  if(!sql) return false;
  const {data:session}=await auth.getSession();
  if(!session?.user) return false;
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL) return true;
  const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
  return String((rows[0] as any)?.role)==='MASTER';
}

function mapClient(r:any){
  return {
    id:String(r.id),name:r.name,type:r.type,category:r.category||'',subcategory:r.subcategory||'',specialty:r.specialty||'',phone:r.phone||'',email:r.email,
    status:r.status,createdAt:r.created_at?new Date(r.created_at).toISOString():undefined,
    trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,
    paymentMethod:r.payment_method||undefined,paymentReference:r.payment_reference||undefined,
    paymentComment:r.payment_comment||undefined,paypalOrderId:r.paypal_order_id||undefined,hasProof:Boolean(r.payment_proof),paymentSubmittedAt:r.payment_submitted_at?new Date(r.payment_submitted_at).toISOString():undefined,paymentRejectionReason:r.payment_rejection_reason||undefined
  };
}

export async function GET(req:Request){
  if(!sql) return NextResponse.json({clients:[]});
  if(!(await isMaster())) return NextResponse.json({error:'No autorizado'},{status:403});
  await sql`UPDATE commercial_clients SET status='PAGO_PENDIENTE' WHERE status='TRIAL' AND trial_ends_at IS NOT NULL AND trial_ends_at < now()`;
  const url=new URL(req.url);
  const id=url.searchParams.get('id');
  if(id){
    const rows=await sql`SELECT * FROM commercial_clients WHERE id=${id}::uuid LIMIT 1`;
    if(!rows.length) return NextResponse.json({error:'Cliente no encontrado'},{status:404});
    return NextResponse.json({client:mapClient(rows[0])});
  }
  const rows=await sql`SELECT * FROM commercial_clients ORDER BY created_at DESC`;
  return NextResponse.json({clients:rows.map(mapClient)});
}

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
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
  if(!(await isMaster())) return NextResponse.json({error:'No autorizado'},{status:403});
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
  if(body.status==='ACTIVO' && prev.status!=='ACTIVO'){
    await sendTransactionalEmail({to:client.email,subject:'Pago aprobado - TURNAVIA',html:turnaviaEmail('Tu cuenta TURNAVIA está activa',`<p>Hola <strong>${client.name}</strong>.</p><p>Tu pago fue revisado y aprobado.</p><p>Ya puedes ingresar y continuar usando TURNAVIA.</p><p><a href="${process.env.APP_URL||'https://turnavia.vercel.app'}/ingresar">Ingresar a TURNAVIA</a></p>`)});
  }
  return NextResponse.json({ok:true,client});
}
