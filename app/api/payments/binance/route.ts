import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const form=await req.formData();
  const clientId=String(form.get('clientId')||'');
  const reference=String(form.get('reference')||'').trim();
  const comment=String(form.get('comment')||'');
  const paymentMethod=String(form.get('paymentMethod')||'BINANCE');
  const proof=form.get('proof');
  if(!reference) return NextResponse.json({error:'Indica la referencia o ID de transacción'},{status:400});
  if(!(proof instanceof File) || proof.size===0) return NextResponse.json({error:'Adjunta el comprobante del pago'},{status:400});
  if(proof.size>5*1024*1024) return NextResponse.json({error:'El comprobante debe pesar máximo 5 MB'},{status:400});
  const allowed=['image/jpeg','image/png','image/webp','application/pdf'];
  if(!allowed.includes(proof.type)) return NextResponse.json({error:'Formato de comprobante no permitido'},{status:400});
  const method=paymentMethod==='PAYPAL'?'PAYPAL':'BINANCE';
  const bytes=Buffer.from(await proof.arrayBuffer());
  const rows=await sql`UPDATE commercial_clients
    SET payment_method=${method},
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
  return NextResponse.json({ok:true,client:{id:String(r.id),name:r.name,type:r.type,specialty:r.specialty||'',phone:r.phone||'',email:r.email,status:r.status,trialEndsAt:r.trial_ends_at?new Date(r.trial_ends_at).toISOString():undefined,paymentMethod:r.payment_method,paymentReference:r.payment_reference,paymentComment:r.payment_comment,hasProof:Boolean(r.payment_proof)}});
}
