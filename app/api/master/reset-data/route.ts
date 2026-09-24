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
        error:`No se ejecutó el blanqueo: TUCITA esperaba encontrar exactamente 1 cuenta Master y encontró ${masterAuth.length}. No se borró ningún dato.`
      },{status:409});
    }

    await sql.transaction([
      // Datos de operación y atención.
      sql`DELETE FROM app_notifications`,
      sql`DELETE FROM waitlist_entries`,
      sql`DELETE FROM appointments`,
      sql`DELETE FROM doctor_status_updates`,
      sql`DELETE FROM availability_blocks`,
      sql`DELETE FROM doctor_locations`,
      sql`DELETE FROM provider_services`,

      // Conserva únicamente los métodos de cobro generales del Master.
      sql`DELETE FROM payment_methods WHERE scope<>'MASTER'`,

      // Cobros, planes y perfiles comerciales.
      sql`DELETE FROM subscriptions`,
      sql`DELETE FROM payments`,
      sql`DELETE FROM patients`,
      sql`DELETE FROM doctors`,
      sql`DELETE FROM users WHERE lower(COALESCE(email,''))<>lower(${masterEmail})`,
      sql`DELETE FROM locations`,
      sql`DELETE FROM organizations`,
      sql`DELETE FROM commercial_clients`,
      sql`DELETE FROM audit_events`,

      // Conserva el perfil de aplicación del Master.
      sql`DELETE FROM app_user_profiles WHERE lower(email)<>lower(${masterEmail})`,

      // Neon Auth vive en la misma base. Better Auth elimina por cascada
      // sesiones/cuentas relacionadas al borrar el usuario.
      sql`DELETE FROM neon_auth."user" WHERE lower(email)<>lower(${masterEmail})`
    ]);

    const counts=await sql`
      SELECT
        (SELECT count(*)::int FROM commercial_clients) AS commercial_clients,
        (SELECT count(*)::int FROM users WHERE lower(COALESCE(email,''))<>lower(${masterEmail})) AS internal_users,
        (SELECT count(*)::int FROM doctors) AS professionals,
        (SELECT count(*)::int FROM patients) AS patients,
        (SELECT count(*)::int FROM appointments) AS appointments,
        (SELECT count(*)::int FROM audit_events) AS audit_events,
        (SELECT count(*)::int FROM app_notifications) AS notifications,
        (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)<>lower(${masterEmail})) AS non_master_auth_users,
        (SELECT count(*)::int FROM neon_auth."user" WHERE lower(email)=lower(${masterEmail})) AS master_auth_users,
        (SELECT count(*)::int FROM app_user_profiles WHERE lower(email)<>lower(${masterEmail})) AS non_master_profiles,
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
      Number(c?.master_auth_users||0)===1;

    if(!clean){
      return NextResponse.json({
        error:'El blanqueo terminó, pero la verificación encontró datos restantes. No continúes creando usuarios todavía.',
        counts:c
      },{status:409});
    }

    return NextResponse.json({
      ok:true,
      message:'TUCITA fue blanqueado correctamente. Solo se conservó la cuenta Master y sus métodos de cobro.',
      counts:{
        clients:0,
        users:0,
        professionals:0,
        patients:0,
        appointments:0,
        auditEvents:0,
        notifications:0,
        authUsers:1,
        appProfiles:Number(c?.non_master_profiles||0),
        masterAuthUsers:1
      }
    });
  }catch(error:any){
    console.error('TUCITA master reset error',error);
    const raw=String(error?.message||error||'Error desconocido');
    const safe=raw
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi,'[conexion protegida]')
      .replace(/password=[^\s]+/gi,'password=[protegido]')
      .slice(0,600);

    return NextResponse.json({
      error:'No se pudo completar el blanqueo. La transacción se revirtió y no debe haber quedado un borrado parcial.',
      technicalDetail:safe
    },{status:500});
  }
}
