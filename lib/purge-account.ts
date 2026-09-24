import { sql } from '@/lib/db';
import { MASTER_EMAIL } from '@/lib/access';

function normalizeEmail(value:string){
  return String(value||'').trim().toLowerCase();
}
function safeIdentifier(value:string){
  return /^[A-Za-z0-9_]+$/.test(value);
}

export async function purgeAccountByEmail(rawEmail:string){
  if(!sql)throw new Error('Base de datos no disponible.');
  const email=normalizeEmail(rawEmail);
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Correo inválido.');
  if(email===MASTER_EMAIL)throw new Error('La cuenta Master principal no puede eliminarse.');

  const authRows=await sql`SELECT id::text AS id FROM neon_auth."user" WHERE lower(email)=lower(${email})`;
  const authIds=(authRows as any[]).map(r=>String(r.id)).filter(Boolean);

  // Limpia primero tablas auxiliares de Neon Auth (sesiones, cuentas, verificaciones, etc.)
  // descubriendo de forma segura las columnas que apuntan al usuario/correo.
  try{
    const cols=await sql`
      SELECT table_name,column_name
      FROM information_schema.columns
      WHERE table_schema='neon_auth'
        AND table_name<>'user'
        AND lower(column_name) IN ('userid','user_id','email','identifier')
      ORDER BY table_name,column_name`;

    for(const row of cols as any[]){
      const table=String(row.table_name||'');
      const column=String(row.column_name||'');
      if(!safeIdentifier(table)||!safeIdentifier(column))continue;
      const q=(sql as any).query;
      if(typeof q!=='function')break;

      const lower=column.toLowerCase();
      if((lower==='userid'||lower==='user_id')&&authIds.length){
        await q.call(sql,
          `DELETE FROM neon_auth."${table}" WHERE "${column}"::text = ANY($1::text[])`,
          [authIds]
        );
      }else if(lower==='email'||lower==='identifier'){
        await q.call(sql,
          `DELETE FROM neon_auth."${table}" WHERE lower("${column}"::text)=lower($1)`,
          [email]
        );
      }
    }
  }catch(error){
    console.error('TUCITA auth residue cleanup warning',error);
  }

  const db=sql;
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
         OR lower(COALESCE(entity_id,''))=lower(${email})
         OR (
           entity_type='COMMERCIAL_CLIENT'
           AND entity_id IN (
             SELECT id::text FROM commercial_clients WHERE lower(email)=lower(${email})
           )
         )`,

    db`DELETE FROM commercial_clients WHERE lower(email)=lower(${email})`,
    db`DELETE FROM users WHERE lower(COALESCE(email,''))=lower(${email})`,
    db`DELETE FROM app_user_profiles WHERE lower(email)=lower(${email})`,
    db`DELETE FROM neon_auth."user" WHERE lower(email)=lower(${email})`
  ]);

  const verify=await sql`
    SELECT
      (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)=lower(${email})) AS profiles,
      (SELECT count(*)::int FROM users WHERE lower(COALESCE(email,''))=lower(${email})) AS users,
      (SELECT count(*)::int FROM patients WHERE lower(COALESCE(email,''))=lower(${email})) AS patients,
      (SELECT count(*)::int FROM commercial_clients WHERE lower(COALESCE(email,''))=lower(${email})) AS commercial,
      (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)=lower(${email})) AS auth`;
  const v=(verify[0] as any)||{};
  const remaining=Number(v.profiles||0)+Number(v.users||0)+Number(v.patients||0)+Number(v.commercial||0)+Number(v.auth||0);
  if(remaining!==0){
    throw new Error('El correo todavía tiene registros asociados. No quedó liberado por completo.');
  }

  return {
    ok:true,
    email,
    emailAvailable:true,
    message:'Cuenta eliminada por completo. El correo quedó libre para registrarse nuevamente.'
  };
}
