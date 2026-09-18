import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

type Method = {
  id:string; scope:'MASTER'|'DOCTOR'; doctorId?:string|null; name:string; type:string;
  accountLabel?:string|null; accountValue?:string|null; instructions?:string|null;
  currency:string; requiresProof:boolean; active:boolean; isPrimary:boolean;
};

declare global { var __turnaviaPaymentMethods: Method[] | undefined }

function fallback(){
  if(!globalThis.__turnaviaPaymentMethods){
    globalThis.__turnaviaPaymentMethods=[
      {id:'m1',scope:'MASTER',name:'PayPal',type:'PAYPAL',accountLabel:'Cuenta',accountValue:'Configurar PayPal',instructions:'Cobro de activación y mensualidad TURNAVIA.',currency:'USD',requiresProof:false,active:true,isPrimary:true},
      {id:'m2',scope:'MASTER',name:'Binance',type:'BINANCE',accountLabel:'UID',accountValue:'Configurar UID',instructions:'Validar referencia antes de activar.',currency:'USDT',requiresProof:true,active:true,isPrimary:false},
      {id:'d1',scope:'DOCTOR',doctorId:'sofia-mendoza',name:'Pago móvil',type:'PAGO_MOVIL',accountLabel:'Banco / teléfono',accountValue:'Configurar datos',instructions:'Realiza el pago y adjunta comprobante.',currency:'USD',requiresProof:true,active:true,isPrimary:true},
      {id:'d2',scope:'DOCTOR',doctorId:'sofia-mendoza',name:'Binance',type:'BINANCE',accountLabel:'UID',accountValue:'Configurar UID',instructions:'Envía el pago y registra el ID de transacción.',currency:'USDT',requiresProof:true,active:true,isPrimary:false},
    ];
  }
  return globalThis.__turnaviaPaymentMethods;
}

async function doctorId(slug:string){
  if(!sql) return null;
  const r=await sql`SELECT id FROM doctors WHERE public_slug=${slug} LIMIT 1`;
  return r[0]?.id as string|undefined;
}

export async function GET(req:Request){
  const u=new URL(req.url);
  const scope=(u.searchParams.get('scope')||'DOCTOR').toUpperCase();
  const slug=u.searchParams.get('slug')||'sofia-mendoza';
  const activeOnly=u.searchParams.get('active')==='1';

  if(sql){
    if(scope==='MASTER'){
      const rows=await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='MASTER' ORDER BY is_primary DESC, created_at`;
      return NextResponse.json({methods:rows});
    }
    const did=await doctorId(slug);
    if(!did) return NextResponse.json({methods:[]});
    const rows=activeOnly
      ? await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='DOCTOR' AND doctor_id=${did} AND active=true ORDER BY is_primary DESC, created_at`
      : await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='DOCTOR' AND doctor_id=${did} ORDER BY is_primary DESC, created_at`;
    return NextResponse.json({methods:rows});
  }

  const rows=fallback().filter(m=>m.scope===scope && (scope==='MASTER'||m.doctorId===slug) && (!activeOnly||m.active));
  return NextResponse.json({methods:rows});
}

export async function POST(req:Request){
  const body=await req.json();
  const scope=body.scope==='MASTER'?'MASTER':'DOCTOR';
  const slug=body.slug||'sofia-mendoza';

  if(sql){
    const did=scope==='DOCTOR'?await doctorId(slug):null;
    if(scope==='DOCTOR'&&!did)return NextResponse.json({error:'Médico no encontrado'},{status:404});
    const rows=await sql`INSERT INTO payment_methods(scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary)
      VALUES(${scope},${did},${body.name},${body.type||'OTRO'},${body.accountLabel||null},${body.accountValue||null},${body.instructions||null},${body.currency||'USD'},${body.requiresProof!==false},true,false)
      RETURNING id`;
    return NextResponse.json({ok:true,id:rows[0]?.id},{status:201});
  }

  const item:Method={id:crypto.randomUUID(),scope,doctorId:scope==='DOCTOR'?slug:null,name:body.name,type:body.type||'OTRO',accountLabel:body.accountLabel||'',accountValue:body.accountValue||'',instructions:body.instructions||'',currency:body.currency||'USD',requiresProof:body.requiresProof!==false,active:true,isPrimary:false};
  fallback().push(item);
  return NextResponse.json({ok:true,id:item.id},{status:201});
}

export async function PATCH(req:Request){
  const body=await req.json();
  if(sql){
    await sql`UPDATE payment_methods SET
      name=COALESCE(${body.name||null},name),
      type=COALESCE(${body.type||null},type),
      account_label=COALESCE(${body.accountLabel??null},account_label),
      account_value=COALESCE(${body.accountValue??null},account_value),
      instructions=COALESCE(${body.instructions??null},instructions),
      currency=COALESCE(${body.currency||null},currency),
      requires_proof=COALESCE(${typeof body.requiresProof==='boolean'?body.requiresProof:null},requires_proof),
      active=COALESCE(${typeof body.active==='boolean'?body.active:null},active),
      is_primary=COALESCE(${typeof body.isPrimary==='boolean'?body.isPrimary:null},is_primary),
      updated_at=now()
      WHERE id=${body.id}::uuid`;
    return NextResponse.json({ok:true});
  }
  const m=fallback().find(x=>x.id===body.id);
  if(!m)return NextResponse.json({error:'Método no encontrado'},{status:404});
  Object.assign(m,Object.fromEntries(Object.entries(body).filter(([k,v])=>k!=='id'&&v!==undefined)));
  return NextResponse.json({ok:true});
}
