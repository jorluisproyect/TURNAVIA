import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { StatusPill } from '@/components/StatusPill';
import { sql } from '@/lib/db';
import { validUuid } from '@/lib/access';
import MasterActions from '../../MasterActions';
import ClientEmailActions from './ClientEmailActions';
import { CalendarDays, CheckCircle2, CreditCard, ExternalLink, History, Mail, Phone, Users } from 'lucide-react';

export const dynamic='force-dynamic';

const labels:any={TRIAL:'Prueba gratis',PAGO_PENDIENTE:'Pago pendiente',REVISION_BINANCE:'Pago en revisión',ACTIVO:'Activo',SUSPENDIDO:'Suspendido'};
const tone=(s:string)=>s==='ACTIVO'?'ok':s==='SUSPENDIDO'?'bad':'warn';
const actionLabels:any={
  PAYMENT_SUBMITTED:'Pago enviado',
  PAYMENT_APPROVED:'Pago aprobado',
  PAYMENT_REJECTED:'Pago rechazado',
  CLIENT_SUSPENDED:'Cuenta suspendida',
  CLIENT_REACTIVATED:'Cuenta reactivada',
  CLIENT_STATUS_CHANGED:'Estado actualizado',
  WELCOME_EMAIL_SENT:'Correo de bienvenida enviado',
  WELCOME_EMAIL_FAILED:'Falló correo de bienvenida',
  ACTIVATION_EMAIL_SENT:'Correo de activación enviado',
  ACTIVATION_EMAIL_FAILED:'Falló correo de activación',
  PAYMENT_EMAIL_STATUS:'Estado de correos del pago'
};

export default async function ClienteMasterDetalle({params}:{params:Promise<{id:string}>}){
  if(!sql) return <div className="dashboard"><Sidebar role="master"/><main className="main"><div className="notice danger">Base de datos no disponible.</div></main></div>;
  const {id}=await params;
  if(!validUuid(id)) notFound();

  const rows=await sql`SELECT * FROM commercial_clients WHERE id=${id}::uuid LIMIT 1`;
  const client=rows[0] as any;
  if(!client) notFound();

  const providerRows=await sql`SELECT u.id AS user_id,u.organization_id,u.full_name,u.email,u.phone,d.id AS doctor_id,d.public_slug,d.provider_category,d.provider_activity,d.provider_type,d.accepts_online_booking,
      o.id AS organization_id_join,o.name AS organization_name,o.slug AS organization_slug
    FROM users u
    LEFT JOIN doctors d ON d.user_id=u.id
    LEFT JOIN organizations o ON o.id=u.organization_id
    WHERE lower(u.email)=lower(${client.email})
    ORDER BY u.created_at LIMIT 1`;
  const provider=providerRows[0] as any;

  const team=provider?.organization_id_join?await sql`SELECT u.full_name,u.email,u.phone,d.public_slug,d.provider_activity,COUNT(ps.id) FILTER(WHERE ps.active=true)::int AS services
    FROM users u
    LEFT JOIN doctors d ON d.user_id=u.id
    LEFT JOIN provider_services ps ON ps.doctor_id=d.id
    WHERE u.organization_id=${provider.organization_id_join}::uuid AND u.active=true
    GROUP BY u.id,d.id
    ORDER BY u.created_at` : [];

  const serviceRows=provider?.doctor_id?await sql`SELECT id,name,duration_minutes,price,currency,active FROM provider_services WHERE doctor_id=${provider.doctor_id}::uuid ORDER BY created_at` : [];
  const events=await sql`SELECT action,metadata,created_at FROM audit_events WHERE entity_type='COMMERCIAL_CLIENT' AND entity_id=${id} ORDER BY created_at DESC LIMIT 50`;

  const publicPath=provider?.organization_slug?'/negocio/'+provider.organization_slug:provider?.public_slug?'/reservar/'+provider.public_slug:'';
  const demo=String(client.email||'').toLowerCase().endsWith('@turnavia.app');
  const monthly=String(client.type||'').startsWith('Negocio')?49:15;
  const initial=String(client.type||'').startsWith('Negocio')?149:40;

  const knownTimeline:any[]=[
    {action:'CLIENT_CREATED',created_at:client.created_at,metadata:{label:'Cuenta creada'}},
    client.payment_submitted_at?{action:'PAYMENT_SUBMITTED',created_at:client.payment_submitted_at,metadata:{method:client.payment_method,reference:client.payment_reference}}:null,
    client.payment_reviewed_at?{action:client.status==='ACTIVO'?'PAYMENT_APPROVED':'CLIENT_STATUS_CHANGED',created_at:client.payment_reviewed_at,metadata:{}}:null,
  ].filter(Boolean);
  const audit=(events as any[]).map(e=>({action:e.action,created_at:e.created_at,metadata:e.metadata||{}}));
  const timeline=[...audit,...knownTimeline]
    .sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())
    .filter((e,i,arr)=>i===arr.findIndex(x=>x.action===e.action&&Math.abs(new Date(x.created_at).getTime()-new Date(e.created_at).getTime())<2000));

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar">
      <div><div className="muted" style={{fontSize:13}}>Master · Cliente</div><h1>{client.name} {demo&&<span className="pill">Demo</span>}</h1></div>
      <div className="button-row"><Link href="/master/clientes" className="btn btn-secondary">Volver a clientes</Link>{publicPath&&<a href={publicPath} target="_blank" rel="noreferrer" className="btn btn-secondary"><ExternalLink size={15}/> Ver página como cliente</a>}</div>
    </div>

    <div className="stat-grid">
      <div className="stat"><small>Estado</small><div style={{marginTop:10}}><StatusPill tone={tone(client.status)}>{labels[client.status]||client.status}</StatusPill></div></div>
      <div className="stat"><small>Plan</small><div className="n" style={{fontSize:20}}>{client.type}</div></div>
      <div className="stat"><small>Mensualidad</small><div className="n">${monthly}</div></div>
      <div className="stat"><small>Activación inicial</small><div className="n">${initial}</div></div>
    </div>

    <div className="panel-grid">
      <section className="panel">
        <h2>Ficha comercial</h2>
        <div style={{display:'grid',gap:10}}>
          <div className="notice"><Mail size={16}/><span><strong>Correo</strong><br/>{client.email}</span></div>
          <div className="notice"><Phone size={16}/><span><strong>Teléfono</strong><br/>{client.phone||'—'}</span></div>
          <div className="notice"><Users size={16}/><span><strong>Rubro</strong><br/>{client.category||'—'}{client.subcategory?' · '+client.subcategory:''}</span></div>
          <div className="notice"><CalendarDays size={16}/><span><strong>Registro</strong><br/>{new Date(client.created_at).toLocaleString('es-VE')}</span></div>
          {client.trial_ends_at&&<div className="notice"><CalendarDays size={16}/><span><strong>Fin de prueba</strong><br/>{new Date(client.trial_ends_at).toLocaleString('es-VE')}</span></div>}
        </div>
        <div style={{marginTop:16}}><MasterActions id={id} status={client.status}/></div>
        <div style={{marginTop:12}}><ClientEmailActions id={id} active={client.status==='ACTIVO'}/></div>
      </section>

      <section className="panel">
        <h2>Último pago TURNAVIA</h2>
        {!client.payment_reference&&!client.payment_submitted_at?<div className="notice">Todavía no hay un pago registrado.</div>:<div style={{display:'grid',gap:10}}>
          <div className="notice"><CreditCard size={16}/><span><strong>Método</strong><br/>{client.payment_method||'—'}</span></div>
          <div className="notice"><span><strong>Referencia</strong><br/>{client.payment_reference||'—'}</span></div>
          {client.payment_submitted_at&&<div className="notice"><span><strong>Enviado</strong><br/>{new Date(client.payment_submitted_at).toLocaleString('es-VE')}</span></div>}
          {client.payment_proof&&<a href={'/api/payments/proof?id='+id} target="_blank" rel="noreferrer" className="btn btn-secondary">Ver comprobante</a>}
          {client.payment_rejection_reason&&<div className="notice danger"><strong>Motivo de rechazo:</strong> {client.payment_rejection_reason}</div>}
        </div>}
      </section>
    </div>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Cuenta y operación</h2><p className="muted" style={{marginTop:-6}}>Información vinculada al usuario que opera TURNAVIA.</p></div>{publicPath&&<code>{publicPath}</code>}</div>
      {!provider?<div className="notice">La cuenta comercial existe, pero todavía no tiene un perfil profesional vinculado.</div>:<div className="grid-3">
        <div className="card"><strong>{provider.full_name}</strong><p className="muted">{provider.provider_activity||client.subcategory||'Profesional'} · {provider.provider_category||client.category||'—'}</p><div>{provider.email}</div></div>
        <div className="card"><strong>Servicios</strong><div className="n" style={{fontSize:30}}>{serviceRows.length}</div><p className="muted">{(serviceRows as any[]).filter(s=>s.active).length} activos</p></div>
        <div className="card"><strong>Equipo</strong><div className="n" style={{fontSize:30}}>{provider.organization_id_join?team.length:1}</div><p className="muted">{provider.organization_name||'Profesional independiente'}</p></div>
      </div>}
    </section>

    {team.length>0&&<section className="panel" style={{marginTop:18}}>
      <h2>Profesionales asociados</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Profesional</th><th>Actividad</th><th>Servicios</th><th>Página</th></tr></thead><tbody>{(team as any[]).map((m:any)=><tr key={m.email}><td><strong>{m.full_name}</strong><div className="muted" style={{fontSize:12}}>{m.email} · {m.phone||'—'}</div></td><td>{m.provider_activity||'—'}</td><td>{m.services}</td><td>{m.public_slug?<a className="btn btn-secondary" href={'/reservar/'+m.public_slug} target="_blank" rel="noreferrer">Ver</a>:'—'}</td></tr>)}</tbody></table></div>
    </section>}

    <section className="panel" style={{marginTop:18}}>
      <div className="row space"><div><h2>Historial comercial</h2><p className="muted" style={{marginTop:-6}}>Registro de pagos y decisiones del Master disponibles desde esta versión.</p></div><History size={20}/></div>
      {timeline.length===0?<div className="notice">Sin eventos todavía.</div>:<div style={{display:'grid',gap:9,marginTop:12}}>{timeline.map((e:any,i:number)=>{
        const meta=e.metadata||{};
        const label=e.action==='CLIENT_CREATED'?'Cuenta creada':actionLabels[e.action]||e.action;
        return <div className="notice row space" key={String(e.created_at)+i} style={{gap:12,flexWrap:'wrap'}}>
          <div><strong>{label}</strong>{meta.method&&<div className="muted" style={{fontSize:12}}>{meta.method}{meta.reference?' · Ref. '+meta.reference:''}{meta.amount?' · USD '+meta.amount:''}</div>}{meta.reason&&<div className="muted" style={{fontSize:12}}>{meta.reason}</div>}</div>
          <span className="muted" style={{fontSize:12}}>{new Date(e.created_at).toLocaleString('es-VE')}</span>
        </div>
      })}</div>}
    </section>

    <section className="panel" style={{marginTop:18}}>
      <div className="notice"><CheckCircle2 size={17}/><span><strong>Vista segura del cliente.</strong><br/>“Ver página como cliente” abre únicamente la página pública. El Master no suplanta ni inicia sesión dentro de la cuenta del cliente.</span></div>
    </section>
  </main></div>;
}
