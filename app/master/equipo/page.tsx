'use client';
import { useEffect,useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
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
  const [busy,setBusy]=useState(false);

  async function load(){
    const r=await fetch('/api/master/team',{cache:'no-store'});
    const j=await r.json();
    if(r.ok)setMembers(j.members||[]);
    else setMsg(j.error||'No se pudo cargar el equipo.');
  }
  useEffect(()=>{load()},[]);

  async function add(){
    if(!form.name.trim()||!form.email.trim())return setMsg('Escribe nombre y correo.');
    setBusy(true);setMsg('');
    const r=await fetch('/api/master/team',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
    const j=await r.json();
    setBusy(false);
    if(!r.ok)return setMsg(j.error||'No se pudo agregar.');
    setForm({name:'',email:'',role:'FRONTEND'});
    setMsg(j.emailSent?'Invitación enviada correctamente.':'Invitación creada. Puedes compartir el enlace cuando el correo esté listo.');
    load();
  }

  async function changeRole(email:string,role:string){
    const r=await fetch('/api/master/team',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({email,role})});
    const j=await r.json();
    if(!r.ok)return setMsg(j.error||'No se pudo actualizar el rol.');
    setMsg('Rol actualizado.');
    load();
  }

  async function revoke(email:string){
    if(!confirm('¿Quitar el acceso Master de '+email+'?'))return;
    const r=await fetch('/api/master/team',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
    const j=await r.json();
    if(!r.ok)return setMsg(j.error||'No se pudo revocar.');
    setMsg('Acceso revocado.');
    load();
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
      </div>
    </section>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Miembros del equipo</h2><p className="muted">Solo tú, como Master propietario, puedes invitar, cambiar roles o revocar accesos.</p></div><button className="btn btn-secondary" onClick={load}><RefreshCcw size={15}/> Actualizar</button></div>
      {members.length===0?<div className="notice">Todavía no has agregado compañeros.</div>:<div className="grid-3" style={{marginTop:12}}>{members.map(m=><div className="card" key={m.email}>
        <div className="row space"><div className="iconbox">{m.role==='DATABASE'?<Database/>:<Code2/>}</div><span className={'status '+(m.status==='ACTIVE'?'ok':m.status==='REVOKED'?'bad':'warn')}>{m.status==='ACTIVE'?'Master activo':m.status==='INVITED'?'Invitado':'Revocado'}</span></div>
        <h3>{m.name||m.email}</h3>
        <p>{m.roleLabel}</p>
        <div className="muted" style={{fontSize:12,marginTop:8,wordBreak:'break-word'}}>{m.email}</div>
        {m.status==='ACTIVE'&&<div className="field" style={{marginTop:12}}><label>Cambiar área</label><select value={m.role} onChange={e=>changeRole(m.email,e.target.value)}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>}
        {m.status!=='REVOKED'&&<button className="btn btn-danger" style={{marginTop:12}} onClick={()=>revoke(m.email)}><XCircle size={15}/> Quitar acceso</button>}
      </div>)}</div>}
    </section>
  </main></div>;
}
