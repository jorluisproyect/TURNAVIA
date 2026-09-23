import { sql } from '@/lib/db';

export async function profileIsDeleted(email:string){
  if(!sql||!email)return false;
  const rows=await sql`
    SELECT action
    FROM audit_events
    WHERE entity_type='ACCOUNT_PROFILE'
      AND action IN ('PROFILE_DELETED','PROFILE_RESTORED')
      AND lower(metadata->>'email')=lower(${email})
    ORDER BY created_at DESC,id DESC
    LIMIT 1`;
  return String((rows[0] as any)?.action||'')==='PROFILE_DELETED';
}

export async function deletedProfileEvent(email:string){
  if(!sql||!email)return null;
  const rows=await sql`
    SELECT action,metadata,created_at
    FROM audit_events
    WHERE entity_type='ACCOUNT_PROFILE'
      AND action IN ('PROFILE_DELETED','PROFILE_RESTORED')
      AND lower(metadata->>'email')=lower(${email})
    ORDER BY created_at DESC,id DESC
    LIMIT 1`;
  const row=rows[0] as any;
  return row&&String(row.action)==='PROFILE_DELETED'?row:null;
}
