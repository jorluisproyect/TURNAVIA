import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';
import { isOwnerMasterSession, MASTER_EMAIL } from '@/lib/access';
import { invitationHash, latestTeamEvent, MASTER_TEAM_ROLES, validTeamRole } from '@/lib/master-team';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const clean=(v:unknown)=>String(v||'').trim();
const emailOf=(v:unknown)=>clean(v).toLowerCase();
const safe=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
async function owner(){return await isOwnerMasterSession()}

export async function GET(){
  if(!(await owner()))return NextResponse.json({error:'Solo Master propietario.'},{status:403});
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  const rows=await sql`SELECT DISTINCT ON (entity_id) entity_id AS email,action,metadata,created_at
    FROM audit_events WHERE entity_type='MASTER_TEAM'
    ORDER BY entity_id,id DESC`;
  const members=rows.map((r:any)=>({
    email:String(r.email),
    name:String(r.metadata?.name||r.email),
    role:String(r.metadata?.role||''),
    roleLabel:(MASTER_TEAM_ROLES as Record<string,string>)[String(r.metadata?.role||'')]||'—',
    status:r.action==='MASTER_TEAM_ACCEPTED'?'ACTIVE':r.action==='MASTER_TEAM_INVITED'?'INVITED':'REVOKED',
    updatedAt:new Date(r.created_at).toISOString()
  }));
  return NextResponse.json({members});
}

export async function POST(req:Request){
  if(!(await owner()))return NextResponse.json({error:'Solo Master propietario.'},{status:403});
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  const body=await req.json();
  const email=emailOf(body.email),name=clean(body.name).slice(0,120),role=clean(body.role);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return NextResponse.json({error:'Correo no válido.'},{status:400});
  if(email===MASTER_EMAIL)return NextResponse.json({error:'El propietario ya es Master principal.'},{status:400});
  if(!name)return NextResponse.json({error:'Indica el nombre de tu compañero.'},{status:400});
  if(!validTeamRole(role))return NextResponse.json({error:'Selecciona un rol válido.'},{status:400});
  const current=await latestTeamEvent(email);
  if(current?.action==='MASTER_TEAM_ACCEPTED')return NextResponse.json({error:'Este compañero ya pertenece al equipo. Puedes cambiar su rol.'},{status:409});
  const token=randomBytes(32).toString('hex');
  const expiresAt=new Date(Date.now()+7*86400000).toISOString();
  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('MASTER_TEAM_INVITED','MASTER_TEAM',${email},
    jsonb_build_object('email',${email},'name',${name},'role',${role},'tokenHash',${invitationHash(token)},'expiresAt',${expiresAt},'invitedBy',${MASTER_EMAIL}))`;
  const invitationUrl=new URL('/equipo/aceptar?invite='+encodeURIComponent(token)+'&email='+encodeURIComponent(email),req.url).toString();
  const mail=await sendTransactionalEmail({
    to:email,
    subject:'Invitación al equipo de TUCITA',
    html:tucitaEmail('Te invitaron al equipo TUCITA',`<p>Hola <strong>${safe(name)}</strong>.</p><p>Te invitaron como <strong>${safe(MASTER_TEAM_ROLES[role])}</strong>. Para aceptar, crea tu cuenta con este mismo correo o inicia sesión si ya tienes una.</p><p><a href="${invitationUrl}">Aceptar invitación</a></p><p>El enlace vence en siete días. No compartas la invitación con otras personas.</p>`)
  });
  return NextResponse.json({ok:true,invitationUrl,emailSent:Boolean(mail.ok),emailError:mail.ok?undefined:'Puedes compartir el enlace de invitación directamente mientras se configura el correo de TUCITA.'});
}

export async function PATCH(req:Request){
  if(!(await owner()))return NextResponse.json({error:'Solo Master propietario.'},{status:403});
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  const body=await req.json(),email=emailOf(body.email),role=clean(body.role);
  if(!validTeamRole(role))return NextResponse.json({error:'Rol no válido.'},{status:400});
  const event=await latestTeamEvent(email);
  if(event?.action!=='MASTER_TEAM_ACCEPTED')return NextResponse.json({error:'Este compañero todavía no activó su acceso.'},{status:409});
  const data=event.metadata||{};
  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('MASTER_TEAM_ACCEPTED','MASTER_TEAM',${email},
    jsonb_build_object('name',${String(data.name||email)},'role',${role},'authUserId',${String(data.authUserId||'')},'changedBy',${MASTER_EMAIL}))`;
  return NextResponse.json({ok:true});
}

export async function DELETE(req:Request){
  if(!(await owner()))return NextResponse.json({error:'Solo Master propietario.'},{status:403});
  if(!sql)return NextResponse.json({error:'Base de datos no disponible.'},{status:503});
  const body=await req.json(),email=emailOf(body.email);
  const event=await latestTeamEvent(email);
  if(!event||event.action==='MASTER_TEAM_REVOKED')return NextResponse.json({error:'Invitación o colaborador no encontrado.'},{status:404});
  const data=event.metadata||{};
  await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
    VALUES('MASTER_TEAM_REVOKED','MASTER_TEAM',${email},
    jsonb_build_object('name',${String(data.name||email)},'role',${String(data.role||'')},'revokedBy',${MASTER_EMAIL}))`;
  return NextResponse.json({ok:true});
}
