import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isMasterSession } from '@/lib/access';

export const dynamic='force-dynamic';

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});

  const body=await req.json();
  const slug=String(body.slug||'').trim();
  const active=Boolean(body.active);
  if(!slug) return NextResponse.json({error:'Profesional no identificado'},{status:400});

  const rows=await sql`SELECT d.id AS doctor_id,u.id AS user_id,u.email
    FROM doctors d JOIN users u ON u.id=d.user_id
    WHERE d.public_slug=${slug} LIMIT 1`;
  const p=rows[0] as any;
  if(!p) return NextResponse.json({error:'Profesional no encontrado'},{status:404});

  await sql`UPDATE users SET active=${active} WHERE id=${p.user_id}::uuid`;
  await sql`UPDATE doctors SET accepts_online_booking=${active} WHERE id=${p.doctor_id}::uuid`;

  if(!active){
    await sql`UPDATE commercial_clients SET status='SUSPENDIDO' WHERE lower(email)=lower(${p.email}) AND status<>'SUSPENDIDO'`;
  }

  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES(${active?'PROFESSIONAL_REACTIVATED':'PROFESSIONAL_DEACTIVATED'},'PROFESSIONAL',${slug},
    jsonb_build_object('email',${p.email}))`;

  return NextResponse.json({ok:true});
}

export async function DELETE(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});

  const body=await req.json();
  const slug=String(body.slug||'').trim();
  if(!slug) return NextResponse.json({error:'Profesional no identificado'},{status:400});

  const rows=await sql`SELECT d.id AS doctor_id,u.id AS user_id,u.email
    FROM doctors d JOIN users u ON u.id=d.user_id
    WHERE d.public_slug=${slug} LIMIT 1`;
  const p=rows[0] as any;
  if(!p) return NextResponse.json({error:'Profesional no encontrado'},{status:404});

  const appointmentRows=await sql`SELECT count(*)::int AS total FROM appointments WHERE doctor_id=${p.doctor_id}::uuid`;
  const appointments=Number((appointmentRows[0] as any)?.total||0);
  const commercialRows=await sql`SELECT id,payment_submitted_at,payment_reviewed_at
    FROM commercial_clients WHERE lower(email)=lower(${p.email}) ORDER BY created_at DESC LIMIT 1`;
  const commercial=commercialRows[0] as any;
  const hasCommercialHistory=Boolean(commercial?.payment_submitted_at||commercial?.payment_reviewed_at);

  if(appointments>0||hasCommercialHistory){
    return NextResponse.json({
      error:'Este profesional tiene historial real de citas o pagos. Por seguridad no se elimina; desactívalo para conservar el historial.',
      canDeactivate:true
    },{status:409});
  }

  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('PROFESSIONAL_DELETED','PROFESSIONAL',${slug},jsonb_build_object('email',${p.email}))`;

  if(commercial?.id) await sql`DELETE FROM commercial_clients WHERE id=${commercial.id}::uuid`;
  await sql`DELETE FROM doctors WHERE id=${p.doctor_id}::uuid`;
  await sql`DELETE FROM users WHERE id=${p.user_id}::uuid`;
  await sql`DELETE FROM app_user_profiles WHERE lower(email)=lower(${p.email})`;

  return NextResponse.json({ok:true});
}
