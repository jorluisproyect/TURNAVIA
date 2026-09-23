import { sql } from '@/lib/db';

export function subscriptionAllowed(status:string,trialEndsAt?:Date|string|null){
  if(status==='ACTIVO') return true;
  if(status!=='TRIAL'&&status!=='REVISION_BINANCE') return false;
  if(!trialEndsAt) return status==='TRIAL';
  return new Date(trialEndsAt).getTime()>Date.now();
}

export async function refreshAllCommercialStatuses(){
  if(!sql) return;
  await sql`UPDATE commercial_clients c
    SET status='PAGO_PENDIENTE'
    WHERE (
      c.status='TRIAL' AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at<now()
    ) OR (
      c.status='ACTIVO' AND COALESCE(
        (
          SELECT NULLIF(a.metadata->>'paidUntil','')::timestamptz
          FROM audit_events a
          WHERE a.entity_type='COMMERCIAL_CLIENT'
            AND a.entity_id=c.id::text
            AND a.action='PAYMENT_APPROVED'
          ORDER BY a.created_at DESC
          LIMIT 1
        ),
        c.payment_reviewed_at + interval '31 days',
        c.created_at + interval '31 days'
      )<now()
    )`;
}

export async function refreshCommercialClientByEmail(email:string){
  if(!sql||!email) return null;
  await sql`UPDATE commercial_clients c
    SET status='PAGO_PENDIENTE'
    WHERE lower(c.email)=lower(${email})
      AND (
        (c.status='TRIAL' AND c.trial_ends_at IS NOT NULL AND c.trial_ends_at<now())
        OR
        (c.status='ACTIVO' AND COALESCE(
          (
            SELECT NULLIF(a.metadata->>'paidUntil','')::timestamptz
            FROM audit_events a
            WHERE a.entity_type='COMMERCIAL_CLIENT'
              AND a.entity_id=c.id::text
              AND a.action='PAYMENT_APPROVED'
            ORDER BY a.created_at DESC
            LIMIT 1
          ),
          c.payment_reviewed_at + interval '31 days',
          c.created_at + interval '31 days'
        )<now())
      )`;
  const rows=await sql`SELECT * FROM commercial_clients WHERE lower(email)=lower(${email}) ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as any)||null;
}
