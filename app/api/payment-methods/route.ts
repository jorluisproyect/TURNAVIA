import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth/server';
import { MASTER_EMAIL } from '@/lib/access';

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

async function access(slug?:string){
  if(!sql) return {master:false,owner:false};
  const {data:session}=await auth.getSession();
  if(!session?.user) return {master:false,owner:false};
  const email=String((session.user as any).email||'').toLowerCase();
  let master=email===MASTER_EMAIL;
  if(!master){
    const rows=await sql`SELECT role FROM app_user_profiles WHERE auth_user_id=${String(session.user.id)} LIMIT 1`;
    master=String((rows[0] as any)?.role)==='MASTER';
  }
  let owner=false;
  if(slug){
    const rows=await sql`SELECT target.id
      FROM doctors target
      JOIN users tu ON tu.id=target.user_id
      JOIN users me ON lower(me.email)=lower(${email})
      WHERE target.public_slug=${slug}
        AND (
          target.user_id=me.id
          OR (tu.organization_id IS NOT NULL AND me.organization_id=tu.organization_id)
        )
      LIMIT 1`;
    owner=rows.length>0;
  }
  return {master,owner};
}

export async function GET(req:Request){
  const u=new URL(req.url);
  const scope=(u.searchParams.get('scope')||'DOCTOR').toUpperCase();
  const slug=u.searchParams.get('slug')||'sofia-mendoza';
  const activeOnly=u.searchParams.get('active')==='1';

  if(sql){
    if(scope==='MASTER'){
      if(activeOnly){
        const rows=await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary
          FROM payment_methods
          WHERE scope='MASTER' AND active=true
          ORDER BY is_primary DESC, created_at`;
        return NextResponse.json({methods:rows});
      }
      const a=await access();
      if(!a.master) return NextResponse.json({error:'No autorizado'},{status:403});
      const rows=await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='MASTER' ORDER BY is_primary DESC, created_at`;
      return NextResponse.json({methods:rows});
    }

    const did=await doctorId(slug);
    if(!did) return NextResponse.json({methods:[]});
    if(!activeOnly){
      const a=await access(slug);
      if(!a.master&&!a.owner) return NextResponse.json({error:'No autorizado'},{status:403});
    }
    let rows=activeOnly
      ? await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='DOCTOR' AND doctor_id=${did} AND active=true ORDER BY is_primary DESC, created_at`
      : await sql`SELECT id,scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary FROM payment_methods WHERE scope='DOCTOR' AND doctor_id=${did} ORDER BY is_primary DESC, created_at`;

    // Team members inherit the business payment methods if they do not have their own.
    if(activeOnly && !rows.length){
      rows=await sql`SELECT pm.id,pm.scope,pm.doctor_id,pm.name,pm.type,pm.account_label,pm.account_value,pm.instructions,pm.currency,pm.requires_proof,pm.active,pm.is_primary
        FROM doctors target
        JOIN users target_user ON target_user.id=target.user_id
        JOIN users owner_user ON owner_user.organization_id=target_user.organization_id AND owner_user.active=true
        JOIN doctors owner_doctor ON owner_doctor.user_id=owner_user.id
        JOIN payment_methods pm ON pm.doctor_id=owner_doctor.id AND pm.scope='DOCTOR' AND pm.active=true
        WHERE target.id=${did} AND target_user.organization_id IS NOT NULL
        ORDER BY owner_user.created_at ASC,pm.is_primary DESC,pm.created_at
        LIMIT 10`;
    }
    return NextResponse.json({methods:rows});
  }

  if(process.env.NODE_ENV==='production') return NextResponse.json({error:'Base de datos no disponible',methods:[]},{status:503});
  const rows=fallback().filter(m=>m.scope===scope && (scope==='MASTER'||m.doctorId===slug) && (!activeOnly||m.active));
  return NextResponse.json({methods:rows});
}

export async function POST(req:Request){
  const body=await req.json();
  const scope=body.scope==='MASTER'?'MASTER':'DOCTOR';
  const slug=body.slug||'sofia-mendoza';

  if(sql){
    const a=await access(scope==='DOCTOR'?slug:undefined);
    if(scope==='MASTER'&&!a.master) return NextResponse.json({error:'No autorizado'},{status:403});
    if(scope==='DOCTOR'&&!a.master&&!a.owner) return NextResponse.json({error:'No autorizado'},{status:403});
    const did=scope==='DOCTOR'?await doctorId(slug):null;
    if(scope==='DOCTOR'&&!did)return NextResponse.json({error:'Profesional no encontrado'},{status:404});
    const rows=await sql`INSERT INTO payment_methods(scope,doctor_id,name,type,account_label,account_value,instructions,currency,requires_proof,active,is_primary)
      VALUES(${scope},${did},${body.name},${body.type||'OTRO'},${body.accountLabel||null},${body.accountValue||null},${body.instructions||null},${body.currency||'USD'},${body.requiresProof!==false},true,false)
      RETURNING id`;
    return NextResponse.json({ok:true,id:rows[0]?.id},{status:201});
  }

  if(process.env.NODE_ENV==='production') return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const item:Method={id:crypto.randomUUID(),scope,doctorId:scope==='DOCTOR'?slug:null,name:body.name,type:body.type||'OTRO',accountLabel:body.accountLabel||'',accountValue:body.accountValue||'',instructions:body.instructions||'',currency:body.currency||'USD',requiresProof:body.requiresProof!==false,active:true,isPrimary:false};
  fallback().push(item);
  return NextResponse.json({ok:true,id:item.id},{status:201});
}

export async function PATCH(req:Request){
  const body=await req.json();
  if(sql){
    const rows=await sql`SELECT pm.scope,d.public_slug FROM payment_methods pm LEFT JOIN doctors d ON d.id=pm.doctor_id WHERE pm.id=${body.id}::uuid LIMIT 1`;
    if(!rows.length) return NextResponse.json({error:'Método no encontrado'},{status:404});
    const row=rows[0] as any;
    const a=await access(row.scope==='DOCTOR'?row.public_slug:undefined);
    if(row.scope==='MASTER'&&!a.master) return NextResponse.json({error:'No autorizado'},{status:403});
    if(row.scope==='DOCTOR'&&!a.master&&!a.owner) return NextResponse.json({error:'No autorizado'},{status:403});

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

  if(process.env.NODE_ENV==='production') return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const m=fallback().find(x=>x.id===body.id);
  if(!m)return NextResponse.json({error:'Método no encontrado'},{status:404});
  Object.assign(m,Object.fromEntries(Object.entries(body).filter(([k,v])=>k!=='id'&&v!==undefined)));
  return NextResponse.json({ok:true});
}


export async function DELETE(req:Request){
  const body=await req.json();
  const id=String(body.id||'');
  if(!id) return NextResponse.json({error:'Método no identificado'},{status:400});

  if(sql){
    const rows=await sql`SELECT pm.scope,d.public_slug FROM payment_methods pm LEFT JOIN doctors d ON d.id=pm.doctor_id WHERE pm.id=${id}::uuid LIMIT 1`;
    if(!rows.length) return NextResponse.json({error:'Método no encontrado'},{status:404});
    const row=rows[0] as any;
    const a=await access(row.scope==='DOCTOR'?row.public_slug:undefined);
    if(row.scope==='MASTER'&&!a.master) return NextResponse.json({error:'No autorizado'},{status:403});
    if(row.scope==='DOCTOR'&&!a.master&&!a.owner) return NextResponse.json({error:'No autorizado'},{status:403});

    await sql`DELETE FROM payment_methods WHERE id=${id}::uuid`;
    return NextResponse.json({ok:true});
  }

  if(process.env.NODE_ENV==='production') return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const list=fallback();
  const index=list.findIndex(x=>x.id===id);
  if(index<0) return NextResponse.json({error:'Método no encontrado'},{status:404});
  list.splice(index,1);
  return NextResponse.json({ok:true});
}
