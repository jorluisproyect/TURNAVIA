import { sql } from '@/lib/db';

export async function resetTucitaToZero(masterEmail:string){
  if(!sql)throw new Error('Base de datos no disponible.');

  const normalized=String(masterEmail||'').trim().toLowerCase();
  if(!normalized)throw new Error('Correo Master no configurado.');

  const masterProfile=await sql`
    SELECT auth_user_id,email
    FROM app_user_profiles
    WHERE lower(email)=lower(${normalized})
    LIMIT 1`;

  if(masterProfile.length!==1){
    throw new Error('No se encontró exactamente un perfil Master. No se borró ningún dato.');
  }

  await sql.transaction([
    // Reinicio completo de todas las tablas públicas excepto el perfil del Master.
    // CASCADE elimina dependencias entre profesionales, clientes, equipo, pagos, citas, etc.
    sql`DO $tucita_reset$
      DECLARE
        t record;
      BEGIN
        FOR t IN
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema='public'
            AND table_type='BASE TABLE'
            AND table_name<>'app_user_profiles'
            AND table_name NOT ILIKE '%migration%'
            AND table_name NOT ILIKE '%schema_version%'
          ORDER BY table_name
        LOOP
          EXECUTE format(
            'TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE',
            t.table_name
          );
        END LOOP;
      END
      $tucita_reset$`,
    sql`DELETE FROM app_user_profiles WHERE lower(email)<>lower(${normalized})`
  ]);

  const counts=await sql`
    SELECT
      (SELECT count(*)::int FROM commercial_clients) AS clients,
      (SELECT count(*)::int FROM doctors) AS professionals,
      (SELECT count(*)::int FROM patients) AS patients,
      (SELECT count(*)::int FROM appointments) AS appointments,
      (SELECT count(*)::int FROM users) AS users,
      (SELECT count(*)::int FROM audit_events WHERE entity_type='MASTER_TEAM') AS team,
      (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)<>lower(${normalized})) AS non_master_profiles,
      (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)=lower(${normalized})) AS master_profiles`;

  const c=counts[0] as any;
  const clean=
    Number(c?.clients||0)===0 &&
    Number(c?.professionals||0)===0 &&
    Number(c?.patients||0)===0 &&
    Number(c?.appointments||0)===0 &&
    Number(c?.users||0)===0 &&
    Number(c?.team||0)===0 &&
    Number(c?.non_master_profiles||0)===0 &&
    Number(c?.master_profiles||0)===1;

  if(!clean)throw new Error('La verificación final detectó datos operativos restantes.');

  return {
    clients:0,
    professionals:0,
    patients:0,
    appointments:0,
    users:0,
    team:0,
    masterProfiles:1
  };
}
