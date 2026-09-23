import { sql } from '@/lib/db';

export type ExistingAccountKind='CLIENT'|'PROFESSIONAL'|'BUSINESS'|'MASTER'|'REGISTERED';
export const existingAccountLabel:Record<ExistingAccountKind,string>={
  CLIENT:'una cuenta Cliente',
  PROFESSIONAL:'una cuenta Profesional',
  BUSINESS:'una cuenta Comercial',
  MASTER:'una cuenta de administración',
  REGISTERED:'una cuenta TUCITA'
};

/** A registered email belongs to one account type; never silently convert its role. */
export async function existingAccountKind(email:string):Promise<ExistingAccountKind|null|undefined>{
  if(!sql)return undefined;
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized)return null;
  const rows=await sql`
    SELECT CASE
      WHEN EXISTS (SELECT 1 FROM app_user_profiles p WHERE lower(p.email)=${normalized} AND p.role::text='MASTER') THEN 'MASTER'
      WHEN EXISTS (SELECT 1 FROM app_user_profiles p WHERE lower(p.email)=${normalized} AND p.role::text='PATIENT') THEN 'CLIENT'
      WHEN EXISTS (SELECT 1 FROM commercial_clients c WHERE lower(c.email)=${normalized} AND (lower(c.type) LIKE 'negocio%' OR lower(c.type) LIKE 'clínica%' OR lower(c.type) LIKE 'clinica%')) THEN 'BUSINESS'
      WHEN EXISTS (SELECT 1 FROM app_user_profiles p WHERE lower(p.email)=${normalized} AND p.role::text IN ('DOCTOR','CLINIC_ADMIN','RECEPTION')) THEN 'PROFESSIONAL'
      WHEN EXISTS (SELECT 1 FROM commercial_clients c WHERE lower(c.email)=${normalized}) THEN 'PROFESSIONAL'
      WHEN EXISTS (SELECT 1 FROM neon_auth."user" u WHERE lower(u.email)=${normalized}) THEN 'REGISTERED'
      ELSE NULL
    END AS kind`;
  return ((rows[0] as any)?.kind||null) as ExistingAccountKind|null;
}

export function existingAccountMessage(kind:ExistingAccountKind){
  return 'Este correo ya está siendo utilizado en '+existingAccountLabel[kind]+'. Ingresa con esa cuenta o utiliza otro correo.';
}
