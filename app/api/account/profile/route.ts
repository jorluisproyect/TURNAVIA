import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { deletedProfileEvent, profileIsDeleted } from '@/lib/profile-lifecycle';
import { refreshCommercialClientByEmail } from '@/lib/subscription';

export const dynamic='force-dynamic';

export async function DELETE(){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});

  const authUserId=String(session.user.id);
  const email=String((session.user as any).email||'').trim().toLowerCase();
  if(!email)return NextResponse.json({error:'La cuenta no tiene correo asociado.'},{status:400});
  if(email===MASTER_EMAIL)return NextResponse.json({error:'La cuenta Master principal no puede eliminarse desde el perfil.'},{status:403});
  if(await profileIsDeleted(email))return NextResponse.json({ok:true,alreadyDeleted:true});

  const profiles=await sql`SELECT role,full_name FROM app_user_profiles WHERE auth_user_id=${authUserId} OR lower(email)=lower(${email}) ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
  const profile=profiles[0] as any;
  if(!profile)return NextResponse.json({error:'Perfil no encontrado.'},{status:404});
  if(String(profile.role)==='MASTER')return NextResponse.json({error:'Una cuenta Master no puede eliminarse desde esta opción.'},{status:403});

  const providerRows=await sql`SELECT u.id AS user_id,u.active,d.id AS doctor_id,d.public_slug,d.accepts_online_booking
    FROM users u
    LEFT JOIN doctors d ON d.user_id=u.id
    WHERE lower(u.email)=lower(${email})
    ORDER BY u.created_at
    LIMIT 1`;
  const provider=providerRows[0] as any;
  const commercial=await refreshCommercialClientByEmail(email);
  const professional=String(profile.role)==='DOCTOR'||Boolean(provider?.doctor_id)||Boolean(commercial);
  const hadActiveSubscription=String(commercial?.status||'')==='ACTIVO';

  if(provider?.user_id){
    await sql`UPDATE users SET active=false WHERE id=${provider.user_id}::uuid`;
  }
  if(provider?.doctor_id){
    await sql`UPDATE doctors SET accepts_online_booking=false WHERE id=${provider.doctor_id}::uuid`;
  }

  if(professional&&commercial?.id){
    await sql`UPDATE commercial_clients SET
      status='PAGO_PENDIENTE',
      payment_reviewed_at=NULL,
      payment_rejection_reason='Perfil eliminado por el titular. La suscripción anterior no se conserva al restaurar.'
      WHERE id=${String(commercial.id)}::uuid`;
  }

  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('PROFILE_DELETED','ACCOUNT_PROFILE',${authUserId},
      jsonb_build_object(
        'email',${email},
        'name',${String(profile.full_name||'Usuario')},
        'role',${String(profile.role||'PATIENT')},
        'professional',${professional},
        'commercialClientId',${commercial?.id?String(commercial.id):null},
        'previousCommercialStatus',${commercial?.status?String(commercial.status):null},
        'previousBookingEnabled',${provider?.doctor_id?Boolean(provider.accepts_online_booking):null},
        'hadActiveSubscription',${hadActiveSubscription},
        'subscriptionForfeited',${professional&&Boolean(commercial)}
      ))`;

  return NextResponse.json({
    ok:true,
    message:professional
      ? 'Perfil eliminado. Tu cuenta dejó de ser visible y la suscripción anterior no se conservará si el Master la restablece.'
      : 'Perfil eliminado. Tu cuenta dejó de estar activa.'
  });
}

export async function POST(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isOwnerMasterSession()))return NextResponse.json({error:'Solo el Master propietario puede restablecer perfiles.'},{status:403});

  const body=await req.json();
  const email=String(body.email||'').trim().toLowerCase();
  if(!email)return NextResponse.json({error:'Correo requerido.'},{status:400});

  const deleted=await deletedProfileEvent(email);
  if(!deleted)return NextResponse.json({error:'Este perfil no está eliminado o ya fue restablecido.'},{status:409});
  const meta=(deleted as any).metadata||{};

  const profiles=await sql`SELECT auth_user_id,role,full_name FROM app_user_profiles WHERE lower(email)=lower(${email}) ORDER BY updated_at DESC NULLS LAST LIMIT 1`;
  const profile=profiles[0] as any;
  if(!profile)return NextResponse.json({error:'El perfil ya no existe en la base de datos y no puede restablecerse automáticamente.'},{status:404});

  await sql`UPDATE users SET active=true WHERE lower(email)=lower(${email})`;
  const previousBooking=meta.previousBookingEnabled===false?false:true;
  await sql`UPDATE doctors d SET accepts_online_booking=${previousBooking}
    FROM users u WHERE d.user_id=u.id AND lower(u.email)=lower(${email})`;

  // A deleted professional can be recovered, but the old paid/trial entitlement is intentionally not restored.
  if(Boolean(meta.professional)){
    await sql`UPDATE commercial_clients SET
      status='PAGO_PENDIENTE',
      payment_reviewed_at=NULL,
      payment_rejection_reason='Perfil restablecido por Master. Requiere una nueva activación o pago.'
      WHERE lower(email)=lower(${email})`;
  }

  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('PROFILE_RESTORED','ACCOUNT_PROFILE',${String(profile.auth_user_id||email)},
      jsonb_build_object(
        'email',${email},
        'name',${String(profile.full_name||meta.name||'Usuario')},
        'role',${String(profile.role||meta.role||'PATIENT')},
        'professional',${Boolean(meta.professional)},
        'subscriptionRestored',false
      ))`;

  if(profile.auth_user_id){
    await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
      VALUES(${String(profile.auth_user_id)},'INFO','Perfil TUCITA restablecido',
        ${Boolean(meta.professional)?'Tu perfil fue restablecido por el Master. Para volver a publicar tus servicios debes activar una nueva suscripción.':'Tu perfil fue restablecido por el Master y ya puedes volver a utilizar TUCITA.'},
        '/panel')`;
  }

  return NextResponse.json({ok:true,professional:Boolean(meta.professional)});
}


export async function PUT(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isOwnerMasterSession()))return NextResponse.json({error:'Solo el Master propietario puede eliminar perfiles por completo.'},{status:403});

  const body=await req.json();
  const email=String(body.email||'').trim().toLowerCase();
  const confirmation=String(body.confirmation||'');
  if(!email)return NextResponse.json({error:'Correo requerido.'},{status:400});
  if(email===MASTER_EMAIL)return NextResponse.json({error:'La cuenta Master principal no puede eliminarse.'},{status:403});
  if(confirmation!=='ELIMINAR')return NextResponse.json({error:'Confirmación final inválida.'},{status:400});

  const deleted=await deletedProfileEvent(email);
  if(!deleted)return NextResponse.json({error:'Primero debes eliminar el perfil de forma recuperable antes de borrarlo por completo.'},{status:409});

  const db=sql;
  try{
    await db.transaction([
      db`DELETE FROM app_notifications
        WHERE auth_user_id IN (
          SELECT auth_user_id FROM app_user_profiles WHERE lower(email)=lower(${email})
          UNION
          SELECT id::text FROM neon_auth."user" WHERE lower(email)=lower(${email})
        )`,

      db`DELETE FROM waitlist_entries
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )
        OR patient_id IN (
          SELECT p.id FROM patients p WHERE lower(COALESCE(p.email,''))=lower(${email})
        )`,

      db`DELETE FROM appointments
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )
        OR patient_id IN (
          SELECT p.id FROM patients p WHERE lower(COALESCE(p.email,''))=lower(${email})
        )`,

      db`DELETE FROM payment_methods
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )`,

      db`DELETE FROM subscriptions
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )
        OR organization_id IN (
          SELECT o.id FROM organizations o
          WHERE lower(COALESCE(o.email,''))=lower(${email})
            AND NOT EXISTS (
              SELECT 1 FROM users teammate
              WHERE teammate.organization_id=o.id
                AND lower(COALESCE(teammate.email,''))<>lower(${email})
            )
        )`,

      db`DELETE FROM doctor_status_updates
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )`,

      db`DELETE FROM availability_blocks
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )`,

      db`DELETE FROM doctor_locations
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )`,

      db`DELETE FROM provider_services
        WHERE doctor_id IN (
          SELECT d.id FROM doctors d JOIN users u ON u.id=d.user_id WHERE lower(u.email)=lower(${email})
        )`,

      db`DELETE FROM doctors
        WHERE user_id IN (SELECT id FROM users WHERE lower(email)=lower(${email}))`,

      db`DELETE FROM patients
        WHERE lower(COALESCE(email,''))=lower(${email})
           OR auth_user_id IN (
             SELECT auth_user_id FROM app_user_profiles WHERE lower(email)=lower(${email})
           )`,

      db`DELETE FROM payments
        WHERE organization_id IN (
          SELECT o.id FROM organizations o
          WHERE lower(COALESCE(o.email,''))=lower(${email})
            AND NOT EXISTS (
              SELECT 1 FROM users teammate
              WHERE teammate.organization_id=o.id
                AND lower(COALESCE(teammate.email,''))<>lower(${email})
            )
        )`,

      db`DELETE FROM locations
        WHERE organization_id IN (
          SELECT o.id FROM organizations o
          WHERE lower(COALESCE(o.email,''))=lower(${email})
            AND NOT EXISTS (
              SELECT 1 FROM users teammate
              WHERE teammate.organization_id=o.id
                AND lower(COALESCE(teammate.email,''))<>lower(${email})
            )
        )`,

      db`DELETE FROM organizations o
        WHERE lower(COALESCE(o.email,''))=lower(${email})
          AND NOT EXISTS (
            SELECT 1 FROM users teammate
            WHERE teammate.organization_id=o.id
              AND lower(COALESCE(teammate.email,''))<>lower(${email})
          )`,

      db`DELETE FROM audit_events
        WHERE lower(COALESCE(metadata->>'email',''))=lower(${email})
           OR (
             entity_type='COMMERCIAL_CLIENT'
             AND entity_id IN (
               SELECT id::text FROM commercial_clients WHERE lower(email)=lower(${email})
             )
           )`,

      db`DELETE FROM commercial_clients WHERE lower(email)=lower(${email})`,
      db`DELETE FROM users WHERE lower(email)=lower(${email})`,
      db`DELETE FROM app_user_profiles WHERE lower(email)=lower(${email})`,
      db`DELETE FROM neon_auth."user" WHERE lower(email)=lower(${email})`
    ]);

    return NextResponse.json({ok:true,message:'Perfil eliminado por completo del sistema.'});
  }catch(error){
    console.error('TUCITA permanent profile deletion error',error);
    return NextResponse.json({error:'No se pudo completar el borrado definitivo. No se aplicaron cambios parciales.'},{status:500});
  }
}
