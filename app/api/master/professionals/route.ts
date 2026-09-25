import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isMasterSession } from '@/lib/access';
import { purgeAccountByEmail } from '@/lib/purge-account';
import { parseProviderMedia, serializeProviderMedia } from '@/lib/provider-media';

export const dynamic='force-dynamic';

export async function PATCH(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});

  const body=await req.json();
  const action=String(body.action||'');
  const slug=String(body.slug||'').trim();
  if(!slug) return NextResponse.json({error:'Profesional no identificado'},{status:400});

  const rows=await sql`SELECT d.id AS doctor_id,d.bio,u.id AS user_id,u.email
    FROM doctors d JOIN users u ON u.id=d.user_id
    WHERE d.public_slug=${slug} LIMIT 1`;
  const p=rows[0] as any;
  if(!p) return NextResponse.json({error:'Profesional no encontrado'},{status:404});

  if(action==='credential_review'){
    const decision=String(body.decision||'');
    if(!['APPROVED','REJECTED'].includes(decision))return NextResponse.json({error:'Decisión de revisión inválida.'},{status:400});
    const media=parseProviderMedia(p.bio);
    const hasCredentials=Boolean(String(media.licenseNumber||'').trim()||(media.workImages||[]).length);
    if(!hasCredentials)return NextResponse.json({error:'El profesional todavía no ha cargado credenciales.'},{status:409});
    const bio=serializeProviderMedia(p.bio,{credentialStatus:decision});
    await sql`UPDATE doctors SET bio=${bio} WHERE id=${p.doctor_id}::uuid`;
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES(${decision==='APPROVED'?'PROFESSIONAL_CREDENTIALS_APPROVED':'PROFESSIONAL_CREDENTIALS_REJECTED'},'PROFESSIONAL',${slug},
      jsonb_build_object('email',${p.email},'decision',${decision}))`;
    return NextResponse.json({ok:true,status:decision});
  }

  const active=Boolean(body.active);
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
      error:'Este profesional ya tiene historial real de citas o pagos. Por seguridad no se elimina; desactívalo para conservar el historial.',
      canDeactivate:true
    },{status:409});
  }

  // Cuentas de prueba sin citas ni pagos reales sí pueden eliminarse de forma
  // individual. Esto limpia también Neon Auth y libera el correo para reutilizarlo,
  // sin tener que ejecutar el reinicio total de TUCITA.
  const result=await purgeAccountByEmail(String(p.email||''));
  return NextResponse.json({
    ok:true,
    emailAvailable:Boolean(result.emailAvailable),
    message:'Cuenta de prueba eliminada y correo liberado correctamente.'
  });
}
