import { sql } from '@/lib/db';

export type DepositMode='NONE'|'FIXED'|'PERCENT';

let ensurePromise:Promise<void>|null=null;

export function normalizedDepositMode(value:any):DepositMode{
  return value==='FIXED'||value==='PERCENT'?value:'NONE';
}

export function depositForTotal(totalValue:number,modeValue:any,rawValue:any){
  const total=Math.max(0,Number(totalValue||0));
  const mode=normalizedDepositMode(modeValue);
  const value=Math.max(0,Number(rawValue||0));
  if(total<=0||mode==='NONE')return 0;
  const raw=mode==='PERCENT'?total*(Math.min(100,value)/100):value;
  return Math.min(total,Math.max(0,Math.round((raw+Number.EPSILON)*100)/100));
}

export async function ensureAppointmentEnhancements(){
  if(!sql)return;
  if(ensurePromise)return ensurePromise;
  ensurePromise=(async()=>{
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_total numeric(10,2)`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2)`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS balance_due numeric(10,2)`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_kind text`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_15_sent_at timestamptz`;
    await sql`CREATE INDEX IF NOT EXISTS appointments_reminder_15_idx ON appointments(starts_at,reminder_15_sent_at)`;
  })().catch(error=>{ensurePromise=null;throw error});
  return ensurePromise;
}
