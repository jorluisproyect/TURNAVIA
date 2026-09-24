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
  const safeMaster=masterEmail.replaceAll("'","''");

  const resetSql=`
DO $reset$
DECLARE
  master_email text := '${safeMaster}';
  tbl record;
  master_auth_count integer;
BEGIN
  SELECT count(*)::int INTO master_auth_count
  FROM neon_auth."user"
  WHERE lower(email)=lower(master_email);

  IF master_auth_count <> 1 THEN
    RAISE EXCEPTION 'No se puede reiniciar: se esperaba exactamente 1 cuenta Master en Neon Auth y se encontraron %.', master_auth_count;
  END IF;

  CREATE TEMP TABLE _tucita_keep_master_profile ON COMMIT DROP AS
    SELECT * FROM public.app_user_profiles
    WHERE lower(email)=lower(master_email);

  CREATE TEMP TABLE _tucita_keep_master_payment_methods ON COMMIT DROP AS
    SELECT * FROM public.payment_methods
    WHERE scope='MASTER';

  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='public'
      AND table_type='BASE TABLE'
      AND table_name NOT LIKE '\\_%'
      AND table_name NOT ILIKE '%migration%'
    ORDER BY table_name
  LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(tbl.table_name) || ' RESTART IDENTITY CASCADE';
  END LOOP;

  INSERT INTO public.app_user_profiles
    SELECT * FROM _tucita_keep_master_profile;

  INSERT INTO public.payment_methods
    SELECT * FROM _tucita_keep_master_payment_methods;

  DELETE FROM neon_auth."user"
  WHERE lower(email)<>lower(master_email);
END
$reset$;`;

  try{
    await sql.query(resetSql);

    const counts=await sql`
      SELECT
        (SELECT count(*)::int FROM commercial_clients) AS commercial_clients,
        (SELECT count(*)::int FROM users) AS internal_users,
        (SELECT count(*)::int FROM doctors) AS professionals,
        (SELECT count(*)::int FROM patients) AS patients,
        (SELECT count(*)::int FROM appointments) AS appointments,
        (SELECT count(*)::int FROM audit_events) AS audit_events,
        (SELECT count(*)::int FROM app_notifications) AS notifications,
        (SELECT count(*)::int FROM neon_auth."user") AS auth_users,
        (SELECT count(*)::int FROM app_user_profiles) AS app_profiles`;
    const c=counts[0] as any;

    return NextResponse.json({
      ok:true,
      message:'TUCITA fue blanqueado correctamente. Solo se conservó la cuenta Master y su configuración de cobro.',
      counts:{
        clients:Number(c?.commercial_clients||0),
        users:Number(c?.internal_users||0),
        professionals:Number(c?.professionals||0),
        patients:Number(c?.patients||0),
        appointments:Number(c?.appointments||0),
        auditEvents:Number(c?.audit_events||0),
        notifications:Number(c?.notifications||0),
        authUsers:Number(c?.auth_users||0),
        appProfiles:Number(c?.app_profiles||0)
      }
    });
  }catch(error:any){
    console.error('TUCITA master reset error',error);
    return NextResponse.json({
      error:'No se pudo completar el blanqueo. La operación se revirtió para evitar dejar datos a medias.',
      detail:process.env.NODE_ENV==='development'?String(error?.message||error):undefined
    },{status:500});
  }
}
