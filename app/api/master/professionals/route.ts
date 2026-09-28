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
  const requestedEmail=String(body.email||'').trim().toLowerCase();

  if(action==='soft_delete'){
    if(!slug&&!requestedEmail)return NextResponse.json({error:'Profesional no identificado'},{status:400});

    const rows=slug
      ?await sql`SELECT
          ap.auth_user_id,
          COALESCE(NULLIF(ap.full_name,''),u.full_name,'Profesional') AS full_name,
          COALESCE(NULLIF(ap.email,''),u.email) AS email,
          u.id AS user_id,
          u.active,
          d.id AS doctor_id,
          d.accepts_online_booking
        FROM doctors d
        JOIN users u ON u.id=d.user_id
        LEFT JOIN app_user_profiles ap ON lower(ap.email)=lower(u.email)
        WHERE d.public_slug=${slug}
        LIMIT 1`
      :await sql`SELECT
          ap.auth_user_id,
          COALESCE(NULLIF(ap.full_name,''),u.full_name,'Profesional') AS full_name,
          COALESCE(NULLIF(ap.email,''),u.email,${requestedEmail}) AS email,
          u.id AS user_id,
          u.active,
          d.id AS doctor_id,
          d.accepts_online_booking
        FROM app_user_profiles ap
        LEFT JOIN users u ON lower(u.email)=lower(ap.email)
        LEFT JOIN doctors d ON d.user_id=u.id
        WHERE lower(ap.email)=lower(${requestedEmail})
          AND ap.role::text='DOCTOR'
        ORDER BY ap.updated_at DESC NULLS LAST
        LIMIT 1`;

    const p=rows[0] as any;
    if(!p)return NextResponse.json({error:'Profesional no encontrado'},{status:404});
    const email=String(p.email||requestedEmail).trim().toLowerCase();
    if(!email)return NextResponse.json({error:'El profesional no tiene correo asociado.'},{status:409});

    const lastLifecycle=await sql`SELECT action
      FROM audit_events
      WHERE entity_type='ACCOUNT_PROFILE'
        AND action IN ('PROFILE_DELETED','PROFILE_RESTORED')
        AND lower(metadata->>'email')=lower(${email})
      ORDER BY created_at DESC,id DESC
      LIMIT 1`;
    if(String((lastLifecycle[0] as any)?.action||'')==='PROFILE_DELETED'){
      return NextResponse.json({ok:true,alreadyDeleted:true,message:'El profesional ya está en Perfiles eliminados.'});
    }

    const commercialRows=await sql`SELECT id,status
      FROM commercial_clients
      WHERE lower(email)=lower(${email})
      ORDER BY created_at DESC LIMIT 1`;
    const commercial=commercialRows[0] as any;

    if(p.user_id)await sql`UPDATE users SET active=false WHERE id=${String(p.user_id)}::uuid`;
    if(p.doctor_id)await sql`UPDATE doctors SET accepts_online_booking=false WHERE id=${String(p.doctor_id)}::uuid`;

    if(commercial?.id){
      await sql`UPDATE commercial_clients SET
        status='PAGO_PENDIENTE',
        payment_reviewed_at=NULL,
        payment_rejection_reason='Perfil eliminado por Master. Requiere nueva activación al restaurar.'
        WHERE id=${String(commercial.id)}::uuid`;
    }

    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES('PROFILE_DELETED','ACCOUNT_PROFILE',${String(p.auth_user_id||p.user_id||email)},
        jsonb_build_object(
          'email',${email},
          'name',${String(body.name||p.full_name||'Profesional')},
          'role','DOCTOR',
          'professional',true,
          'deletedByMaster',true,
          'commercialClientId',${commercial?.id?String(commercial.id):null},
          'previousCommercialStatus',${commercial?.status?String(commercial.status):null},
          'previousBookingEnabled',${p.doctor_id?Boolean(p.accepts_online_booking):null},
          'hadActiveSubscription',${String(commercial?.status||'')==='ACTIVO'}
        ))`;

    return NextResponse.json({ok:true,message:'Profesional movido a Perfiles eliminados.'});
  }

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
    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(${decision==='APPROVED'?'PROFESSIONAL_CREDENTIALS_APPROVED':'PROFESSIONAL_CREDENTIALS_REJECTED'},'PROFESSIONAL',${slug},
        jsonb_build_object('email',${p.email},'decision',${decision}))`;
    }catch(error){
      console.error('TUCITA credential review audit warning',error);
    }
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
