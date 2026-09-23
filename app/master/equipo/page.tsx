'use client';
import { useEffect,useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';
import { Code2, Database, UserPlus, Users, XCircle, RefreshCcw } from 'lucide-react';

type Member={email:string;name:string;role:string;roleLabel:string;status:'ACTIVE'|'INVITED'|'REVOKED';updatedAt:string};
const roles=[
  ['FRONTEND','Desarrollo frontend'],
  ['BACKEND','Desarrollo backend'],
  ['DATABASE','Base de datos'],
  ['QA','Pruebas y calidad'],
  ['DESIGN','Diseño / experiencia'],
  ['FULLSTACK','Desarrollo full stack'],
] as const;

export default function MasterEquipo(){
  const [members,setMembers]=useState<Member[]>([]);
  const [form,setForm]=useState({name:'',email:'',role:'FRONTEND'});
  const [msg,setMsg]=useState('');
  const [invitationUrl,setInvitationUrl]=useState('');
  const {busy,run}=useActionLock();

  async function load(){
    const r=await fetch('/api/master/team',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setMembers(j.members||[]);
    else setMsg(j.error||'No se pudo cargar el equipo.');
  }
  useEffect(()=>{load()},[]);

  async function add(){
    if(!form.name.trim()||!form.email.trim()){setMsg('Escribe nombre y correo.');return}
    await run(async()=>{
      setMsg('');showActionFeedback('saving','Creando invitación para tu compañero…');
      try{
        const r=await fetch('/api/master/team',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo agregar al compañero.');return}
        setInvitationUrl(String(j.invitationUrl||''));
        setForm({name:'',email:'',role:'FRONTEND'});
        showActionFeedback('success',j.emailSent?'Invitación enviada correctamente.':'Invitación creada. Copia el enlace privado para compartirlo.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  async function changeRole(email:string,role:string){
    await run(async()=>{
      showActionFeedback('saving','Actualizando el rol del compañero…');
      try{
        const r=await fetch('/api/master/team',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({email,role})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo cambiar el rol.');return}
        showActionFeedback('success','Rol actualizado correctamente.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  async function revoke(email:string){
    if(busy||!confirm('¿Quitar el acceso Master de '+email+'?'))return;
    await run(async()=>{
      showActionFeedback('saving','Quitando acceso del compañero…');
      try{
        const r=await fetch('/api/master/team',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo revocar el acceso.');return}
        showActionFeedback('success','Acceso revocado correctamente.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  return <div className="dashboard"><Sidebar role="master"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>TUCITA · Equipo interno</div><h1>Equipo de trabajo</h1></div></div>

    <section className="panel">
      <div className="row space" style={{gap:16,flexWrap:'wrap'}}>
        <div><span className="eyebrow"><Users size={15}/> ACCESO MASTER</span><h2 style={{marginTop:10}}>Agregar compañero</h2><p className="muted">Asigna un área de trabajo. El invitado crea su propia contraseña y entra como Master colaborador.</p></div>
      </div>
      <div className="form">
        <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}>
          <div className="field" style={{flex:1,minWidth:200}}><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. Juan Pérez"/></div>
          <div className="field" style={{flex:1,minWidth:230}}><label>Correo</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="juan@correo.com"/></div>
          <div className="field" style={{flex:1,minWidth:220}}><label>Área / rol</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <button className="btn btn-primary" onClick={add} disabled={busy}><UserPlus size={16}/>{busy?' Agregando...':' Agregar e invitar'}</button>
        {msg&&<div className="notice">{msg}</div>}
        {invitationUrl&&<div className="notice" style={{display:'grid',gap:9}}>
          <strong>Enlace privado para tu compañero</strong>
          <input readOnly value={invitationUrl} aria-label="Enlace privado de invitación" style={{width:'100%',minWidth:0,border:'1px solid var(--line)',borderRadius:10,padding:10}}/>
          <button type="button" className="btn btn-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(invitationUrl);showActionFeedback('success','Enlace copiado. Compártelo de forma privada con tu compañero.')}catch{showActionFeedback('error','No se pudo copiar. Copia el enlace desde el campo de arriba.')}}}>Copiar invitación</button>
          <small className="muted">El enlace dura 7 días y solo sirve con el correo invitado. No lo publiques.</small>
        </div>}
      </div>
    </section>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Miembros del equipo</h2><p className="muted">Solo tú, como Master propietario, puedes invitar, cambiar roles o revocar accesos.</p></div><button className="btn btn-secondary" disabled={busy} onClick={load}><RefreshCcw size={15}/> Actualizar</button></div>
      {members.length===0?<div className="notice">Todavía no has agregado compañeros.</div>:<div className="grid-3" style={{marginTop:12}}>{members.map(m=><div className="card" key={m.email}>
        <div className="row space"><div className="iconbox">{m.role==='DATABASE'?<Database/>:<Code2/>}</div><span className={'status '+(m.status==='ACTIVE'?'ok':m.status==='REVOKED'?'bad':'warn')}>{m.status==='ACTIVE'?'Master activo':m.status==='INVITED'?'Invitado':'Revocado'}</span></div>
        <h3>{m.name||m.email}</h3>
        <p>{m.roleLabel}</p>
        <div className="muted" style={{fontSize:12,marginTop:8,wordBreak:'break-word'}}>{m.email}</div>
        {m.status==='ACTIVE'&&<div className="field" style={{marginTop:12}}><label>Cambiar área</label><select value={m.role} disabled={busy} onChange={e=>changeRole(m.email,e.target.value)}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>}
        {m.status!=='REVOKED'&&<button className="btn btn-danger" style={{marginTop:12}} disabled={busy} onClick={()=>revoke(m.email)}><XCircle size={15}/> Quitar acceso</button>}
      </div>)}</div>}
    </section>
  </main></div>;
}
