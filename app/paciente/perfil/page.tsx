'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function PerfilPaciente(){
  const [form,setForm]=useState({name:'',email:'',phone:'',nationalId:''});
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{fetch('/api/me/patient').then(r=>r.json()).then(j=>{if(j.patient)setForm(j.patient);setLoading(false)}).catch(()=>setLoading(false))},[]);

  async function save(){
    const r=await fetch('/api/me/patient',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'profile',...form})});
    const j=await r.json();setMsg(r.ok?'Perfil actualizado':j.error||'No se pudo guardar');setTimeout(()=>setMsg(''),1800);
  }

  return <div className="dashboard"><Sidebar role="paciente"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Mi cuenta</div><h1>Perfil</h1></div></div>
    <section className="panel"><h2>Datos personales</h2>{loading?<div>Cargando…</div>:<div className="form">
      <div className="field"><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
      <div className="field"><label>Correo de acceso</label><input value={form.email} readOnly/></div>
      <div className="field"><label>Teléfono</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
      <div className="field"><label>Documento (opcional)</label><input value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></div>
      <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
    </div>}</section>
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
