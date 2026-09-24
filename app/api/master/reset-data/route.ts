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
    const masterProfile=await sql`
      SELECT auth_user_id,email
      FROM app_user_profiles
      WHERE lower(email)=lower(${masterEmail})
      LIMIT 1`;

    if(masterProfile.length!==1){
      return NextResponse.json({
        error:'No se ejecutó el blanqueo porque no se encontró exactamente un perfil Master. No se borró ningún dato.'
      },{status:409});
    }

    // Borra toda la base operativa pública, excepto las dos tablas donde
    // debemos conservar al Master y sus métodos generales de cobro.
    await sql.transaction([
      sql`DO $tucita_reset$
        DECLARE
          t record;
        BEGIN
          FOR t IN
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
              AND table_type='BASE TABLE'
              AND table_name NOT IN ('app_user_profiles','payment_methods')
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
      sql`DELETE FROM app_user_profiles WHERE lower(email)<>lower(${masterEmail})`,
      sql`DELETE FROM payment_methods WHERE scope<>'MASTER'`
    ]);

    // Neon Auth se limpia como paso separado y de mejor esfuerzo. Si el
    // proveedor no permite borrado administrativo, NO impide que TUCITA quede
    // operativamente en cero.
    let staleAuthUsers=0;
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

    try{
      const authCount=await sql`
        SELECT count(*)::int AS n
        FROM neon_auth."user"
        WHERE lower(email)<>lower(${masterEmail})`;
      staleAuthUsers=Number((authCount[0] as any)?.n||0);
    }catch{
      staleAuthUsers=0;
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
      Number(c?.non_master_profiles||0)===0 &&
      Number(c?.non_master_payment_methods||0)===0 &&
      Number(c?.master_profiles||0)===1;

    if(!clean){
      return NextResponse.json({
        error:'La base se limpió parcialmente, pero la verificación encontró datos operativos restantes.',
        technicalDetail:JSON.stringify(c)
      },{status:409});
    }

    return NextResponse.json({
      ok:true,
      message:'TUCITA quedó en cero para comenzar con usuarios reales.',
      warning:staleAuthUsers>0
        ? `Quedaron ${staleAuthUsers} acceso(s) antiguos únicamente en Neon Auth. No aparecen en TUCITA ni cuentan en métricas; sus correos pueden reutilizarse mediante el flujo de registro/recuperación.`
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
        staleAuthUsers,
        masterProfiles:1
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
