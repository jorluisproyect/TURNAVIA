import { NextResponse } from 'next/server';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { sql } from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(req:Request){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  if(!(await isOwnerMasterSession()))return NextResponse.json({error:'Solo el Master propietario puede reiniciar TUCITA.'},{status:403});

  const body=await req.json().catch(()=>({}));
  if(String(body.confirmation||'')!=='BLANQUEAR TUCITA'){
    return NextResponse.json({error:'Confirmación final inválida.'},{status:400});
  }

  const masterEmail=String(MASTER_EMAIL||'').trim().toLowerCase();
  if(!masterEmail)return NextResponse.json({error:'Correo Master no configurado.'},{status:500});

  try{
    const masterAuth=await sql`
      SELECT id,email
      FROM neon_auth."user"
      WHERE lower(email)=lower(${masterEmail})`;

    if(masterAuth.length!==1){
      return NextResponse.json({
        error:`No se ejecutó el blanqueo: se esperaba exactamente 1 cuenta Master y se encontraron ${masterAuth.length}. No se borró ningún dato.`
      },{status:409});
    }

    const masterProfiles=await sql`
      SELECT count(*)::int AS n
      FROM app_user_profiles
      WHERE lower(email)=lower(${masterEmail})`;

    if(Number((masterProfiles[0] as any)?.n||0)<1){
      return NextResponse.json({
        error:'No se ejecutó el blanqueo porque no se encontró el perfil Master de la aplicación. No se borró ningún dato.'
      },{status:409});
    }

    await sql.transaction([
      // Las copias temporales viven fuera del esquema public, por lo que
      // sobreviven al TRUNCATE masivo dentro de esta misma transacción.
      sql`CREATE TEMP TABLE _tucita_keep_master_profile ON COMMIT DROP AS
          SELECT * FROM public.app_user_profiles
          WHERE lower(email)=lower(${masterEmail})`,

      sql`CREATE TEMP TABLE _tucita_keep_master_payment_methods ON COMMIT DROP AS
          SELECT * FROM public.payment_methods
          WHERE scope='MASTER'`,

      // Vacía TODAS las tablas operativas públicas, incluso tablas nuevas
      // añadidas posteriormente. CASCADE evita errores por claves foráneas.
      sql`DO $tucita_reset$
          DECLARE
            t record;
          BEGIN
            FOR t IN
              SELECT table_name
              FROM information_schema.tables
              WHERE table_schema='public'
                AND table_type='BASE TABLE'
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

      // Devuelve únicamente la identidad funcional del Master.
      sql`INSERT INTO public.app_user_profiles
          SELECT * FROM _tucita_keep_master_profile`,

      // Conservamos los medios con los que el Master cobra TUCITA.
      sql`INSERT INTO public.payment_methods
          SELECT * FROM _tucita_keep_master_payment_methods`,

      // Elimina del directorio de autenticación a todos menos al Master.
      // Better Auth/Neon Auth mantiene sus dependencias con cascada.
      sql`DELETE FROM neon_auth."user"
          WHERE lower(email)<>lower(${masterEmail})`
    ]);

    const counts=await sql`
      SELECT
        (SELECT count(*)::int FROM commercial_clients) AS commercial_clients,
        (SELECT count(*)::int FROM users) AS internal_users,
        (SELECT count(*)::int FROM doctors) AS professionals,
        (SELECT count(*)::int FROM patients) AS patients,
        (SELECT count(*)::int FROM appointments) AS appointments,
        (SELECT count(*)::int FROM audit_events) AS audit_events,
        (SELECT count(*)::int FROM app_notifications) AS notifications,
        (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)<>lower(${masterEmail})) AS non_master_auth_users,
        (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)=lower(${masterEmail})) AS master_auth_users,
        (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)<>lower(${masterEmail})) AS non_master_profiles,
        (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)=lower(${masterEmail})) AS master_profiles,
        (SELECT count(*)::int FROM payment_methods WHERE scope<>'MASTER') AS non_master_payment_methods`;

    const c=counts[0] as any;
    const clean=
      Number(c?.commercial_clients||0)===0 &&
      Number(c?.internal_users||0)===0 &&
      Number(c?.professionals||0)===0 &&
      Number(c?.patients||0)===0 &&
      Number(c?.appointments||0)===0 &&
      Number(c?.audit_events||0)===0 &&
      Number(c?.notifications||0)===0 &&
      Number(c?.non_master_auth_users||0)===0 &&
      Number(c?.non_master_profiles||0)===0 &&
      Number(c?.non_master_payment_methods||0)===0 &&
      Number(c?.master_auth_users||0)===1 &&
      Number(c?.master_profiles||0)>=1;

    if(!clean){
      return NextResponse.json({
        error:'El proceso terminó pero la verificación no quedó completamente en cero. No crees usuarios todavía.',
        technicalDetail:JSON.stringify(c)
      },{status:409});
    }

    return NextResponse.json({
      ok:true,
      message:'TUCITA quedó en cero. Se conservó únicamente el Master y sus métodos de cobro.',
      counts:{
        clients:0,
        users:0,
        professionals:0,
        patients:0,
        appointments:0,
        auditEvents:0,
        notifications:0,
        authUsers:1,
        masterAuthUsers:1,
        masterProfiles:Number(c?.master_profiles||1)
      }
    });
  }catch(error:any){
    console.error('TUCITA master reset error',error);
    const raw=String(error?.message||error||'Error desconocido');
    const safe=raw
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi,'[conexion protegida]')
      .replace(/password=[^\s]+/gi,'password=[protegido]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi,'Bearer [protegido]')
      .slice(0,900);

    return NextResponse.json({
      error:'No se pudo completar el blanqueo. La transacción fue revertida automáticamente.',
      technicalDetail:safe
    },{status:500});
  }
}
