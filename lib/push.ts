import { sql } from '@/lib/db';

type PushPayload={title:string;body:string;url?:string};

function vapidConfig(){
  const publicKey=String(process.env.VAPID_PUBLIC_KEY||'').trim();
  const privateKey=String(process.env.VAPID_PRIVATE_KEY||'').trim();
  const subject=String(process.env.VAPID_SUBJECT||'mailto:notificaciones@tucita.com.ve').trim();
  return {publicKey,privateKey,subject,ready:Boolean(publicKey&&privateKey&&subject)};
}

export function pushConfig(){
  const cfg=vapidConfig();
  return {ready:cfg.ready,publicKey:cfg.publicKey};
}

export async function ensurePushTable(){
  if(!sql)return false;
  await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id text NOT NULL,
    endpoint text UNIQUE NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(auth_user_id)`;
  return true;
}

export async function savePushSubscription(authUserId:string,subscription:any){
  if(!sql)throw new Error('Base de datos no disponible.');
  const endpoint=String(subscription?.endpoint||'').trim();
  const p256dh=String(subscription?.keys?.p256dh||'').trim();
  const auth=String(subscription?.keys?.auth||'').trim();
  if(!endpoint||!p256dh||!auth)throw new Error('Suscripción push inválida.');
  await ensurePushTable();
  await sql`INSERT INTO push_subscriptions(auth_user_id,endpoint,p256dh,auth)
    VALUES(${authUserId},${endpoint},${p256dh},${auth})
    ON CONFLICT(endpoint) DO UPDATE SET
      auth_user_id=EXCLUDED.auth_user_id,
      p256dh=EXCLUDED.p256dh,
      auth=EXCLUDED.auth,
      updated_at=now()`;
}

export async function deletePushSubscription(authUserId:string,endpoint:string){
  if(!sql)return;
  try{
    await ensurePushTable();
    await sql`DELETE FROM push_subscriptions WHERE auth_user_id=${authUserId} AND endpoint=${endpoint}`;
  }catch{}
}

export async function sendPushToAuthUser(authUserId:string,payload:PushPayload){
  if(!sql||!authUserId)return {ok:false,skipped:true};
  const cfg=vapidConfig();
  if(!cfg.ready)return {ok:false,skipped:true,reason:'VAPID_NOT_CONFIGURED'};
  try{
    await ensurePushTable();
    const rows=await sql`SELECT endpoint,p256dh,auth FROM push_subscriptions WHERE auth_user_id=${authUserId}`;
    if(!rows.length)return {ok:false,skipped:true,reason:'NO_SUBSCRIPTIONS'};
    // CommonJS package used only in Node runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush:any=require('web-push');
    webpush.setVapidDetails(cfg.subject,cfg.publicKey,cfg.privateKey);
    let sent=0;
    for(const row of rows as any[]){
      try{
        await webpush.sendNotification({
          endpoint:String(row.endpoint),
          keys:{p256dh:String(row.p256dh),auth:String(row.auth)}
        },JSON.stringify(payload),{TTL:120,urgency:'high'});
        sent++;
      }catch(error:any){
        const code=Number(error?.statusCode||0);
        if(code===404||code===410){
          await sql`DELETE FROM push_subscriptions WHERE endpoint=${String(row.endpoint)}`;
        }else{
          console.error('TUCITA push delivery error',error);
        }
      }
    }
    return {ok:sent>0,sent};
  }catch(error){
    console.error('TUCITA push error',error);
    return {ok:false,error:'PUSH_FAILED'};
  }
}
