import { createHash, timingSafeEqual } from 'node:crypto';
import { sql } from '@/lib/db';

export const MASTER_TEAM_ROLES={
  FRONTEND:'Desarrollo frontend',
  BACKEND:'Desarrollo backend',
  DATABASE:'Base de datos',
  QA:'Pruebas y calidad',
  DESIGN:'Diseño / experiencia',
  FULLSTACK:'Desarrollo full stack',
} as const;
export type MasterTeamRole=keyof typeof MASTER_TEAM_ROLES;
export type MasterTeamMember={email:string;name:string;role:MasterTeamRole;authUserId:string};

function normalizedEmail(email:string){return String(email||'').trim().toLowerCase()}
export function validTeamRole(value:string):value is MasterTeamRole{
  return Object.prototype.hasOwnProperty.call(MASTER_TEAM_ROLES,value);
}
export function invitationHash(token:string){return createHash('sha256').update(token).digest('hex')}

export async function latestTeamEvent(email:string){
  if(!sql)return null;
  const rows=await sql`SELECT action,metadata,created_at FROM audit_events
    WHERE entity_type='MASTER_TEAM' AND entity_id=${normalizedEmail(email)}
    ORDER BY id DESC LIMIT 1`;
  return (rows[0] as any)||null;
}

export async function validPendingInvitation(email:string,token:string){
  if(!sql||!token||token.length>256)return null;
  const event=await latestTeamEvent(email);
  const data=event?.metadata||{};
  if(event?.action!=='MASTER_TEAM_INVITED'||!validTeamRole(String(data.role||'')))return null;
  if(!data.expiresAt||new Date(data.expiresAt).getTime()<=Date.now())return null;
  const expected=String(data.tokenHash||'');
  const actual=invitationHash(token);
  if(!/^[a-f0-9]{64}$/.test(expected))return null;
  if(!timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(actual,'hex')))return null;
  return {email:normalizedEmail(email),name:String(data.name||''),role:data.role as MasterTeamRole};
}

export async function teamMemberForUser(user:{id?:string;email?:string}|null|undefined):Promise<MasterTeamMember|null>{
  if(!user?.id||!user?.email||!sql)return null;
  const email=normalizedEmail(user.email);
  const event=await latestTeamEvent(email);
  const data=event?.metadata||{};
  if(event?.action!=='MASTER_TEAM_ACCEPTED'||String(data.authUserId||'')!==String(user.id)||!validTeamRole(String(data.role||'')))return null;
  return {email,name:String(data.name||email),role:data.role as MasterTeamRole,authUserId:String(user.id)};
}
