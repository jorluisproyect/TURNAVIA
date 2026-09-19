import { sql } from '@/lib/db';

export function subscriptionAllowed(status:string,trialEndsAt?:Date|string|null){
  if(status==='ACTIVO') return true;
  if(status!=='TRIAL') return false;
  if(!trialEndsAt) return true;
  return new Date(trialEndsAt).getTime()>Date.now();
}

export async function refreshCommercialClientByEmail(email:string){
  if(!sql||!email) return null;
  await sql`UPDATE commercial_clients
    SET status='PAGO_PENDIENTE'
    WHERE lower(email)=lower(${email})
      AND (
        (status='TRIAL' AND trial_ends_at IS NOT NULL AND trial_ends_at<now())
        OR
        (status='ACTIVO' AND COALESCE(payment_reviewed_at,created_at)<now()-interval '31 days')
      )`;
  const rows=await sql`SELECT * FROM commercial_clients WHERE lower(email)=lower(${email}) ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as any)||null;
}
