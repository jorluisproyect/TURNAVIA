import { NextResponse } from 'next/server';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { sql } from '@/lib/db';
import { auth } from '@/lib/auth/server';

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

    ]);

    // Limpieza del directorio de autenticación. Primero usamos la API oficial
    // de Neon Auth; si el Master no tiene rol admin allí, intentamos SQL.
    // Ninguna de estas dos vías vuelve a ensuciar la base operativa si falla.
    let authCleanup='api';
    let authCleanupError='';
    try{
      let offset=0;
      for(let page=0;page<20;page++){
        const listed:any=await auth.admin.listUsers({query:{limit:100,offset}});
        if(listed?.error)throw new Error(listed.error.message||'Neon Auth no permitió listar usuarios.');
        const users:any[]=listed?.data?.users||listed?.users||[];
        const removable=users.filter((u:any)=>String(u?.email||'').toLowerCase()!==masterEmail);
        for(const u of removable){
          const removed:any=await auth.admin.removeUser({userId:String(u.id)});
          if(removed?.error)throw new Error(removed.error.message||('No se pudo eliminar '+String(u.email||u.id)));
        }
        const total=Number(listed?.data?.total??listed?.total??users.length);
        offset+=users.length;
        if(!users.length||offset>=total)break;
      }
    }catch(apiError:any){
      authCleanup='sql';
      authCleanupError=String(apiError?.message||apiError||'');
      try{
        await sql`DELETE FROM neon_auth."user" WHERE lower(email)<>lower(${masterEmail})`;
      }catch(sqlError:any){
        authCleanup='deferred';
        authCleanupError=[authCleanupError,String(sqlError?.message||sqlError||'')].filter(Boolean).join(' | ').slice(0,700);
      }
    }

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
    const publicClean=
      Number(c?.commercial_clients||0)===0 &&
      Number(c?.internal_users||0)===0 &&
      Number(c?.professionals||0)===0 &&
      Number(c?.patients||0)===0 &&
      Number(c?.appointments||0)===0 &&
      Number(c?.audit_events||0)===0 &&
      Number(c?.notifications||0)===0 &&
      Number(c?.non_master_profiles||0)===0 &&
      Number(c?.non_master_payment_methods||0)===0 &&
      Number(c?.master_auth_users||0)===1 &&
      Number(c?.master_profiles||0)>=1;

    if(!publicClean){
      return NextResponse.json({
        error:'El proceso terminó pero la verificación no quedó completamente en cero. No crees usuarios todavía.',
        technicalDetail:JSON.stringify(c)
      },{status:409});
    }

    const staleAuthUsers=Number(c?.non_master_auth_users||0);
    return NextResponse.json({
      ok:true,
      message:staleAuthUsers===0
        ? 'TUCITA quedó completamente en cero. Se conservó únicamente el Master y sus métodos de cobro.'
        : 'La base operativa de TUCITA quedó en cero. Neon Auth conservó algunos accesos antiguos; TUCITA permitirá reutilizar esos correos al registrarlos nuevamente.',
      warning:staleAuthUsers>0
        ? `Quedaron ${staleAuthUsers} acceso(s) antiguos solo en Neon Auth. No cuentan en métricas ni tienen perfil, citas o suscripción. Puedes registrar nuevamente esos correos con su contraseña anterior o recuperar la contraseña.`
        : null,
      authCleanup,
      authCleanupError:staleAuthUsers>0?authCleanupError:undefined,
      counts:{
        clients:0,
        users:0,
        professionals:0,
        patients:0,
        appointments:0,
        auditEvents:0,
        notifications:0,
        authUsers:1+staleAuthUsers,
        staleAuthUsers,
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
