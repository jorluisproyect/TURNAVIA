'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function Activar(){
 const [done,setDone]=useState<any>(null); const [type,setType]=useState('Médico independiente'); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
 const [form,setForm]=useState({name:'',specialty:'',phone:'',email:''});
 async function submit(){
  if(!form.name||!form.phone||!form.email){setError('Completa nombre, WhatsApp y correo.');return}
  setLoading(true); setError('');
  try{
    const r=await fetch('/api/clients',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,...form})});
    const j=await r.json();
    if(!r.ok || !j?.client){setError(j?.error||'No se pudo crear la prueba.');return}
    setDone(j);
  }catch{setError('No se pudo conectar con TURNAVIA. Intenta nuevamente.')}
  finally{setLoading(false)}
 }
 if(done?.client)return <main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card" style={{marginTop:40,textAlign:'center',padding:42}}><div className="iconbox" style={{margin:'0 auto'}}><CheckCircle2/></div><h1>Tu prueba gratis comenzó</h1><p className="muted">Tienes <strong>5 días completos</strong> para probar TURNAVIA sin tarjeta.</p><div className="notice" style={{margin:'18px 0'}}>La prueba termina el <strong>{done.client.trialEndsAt?new Date(done.client.trialEndsAt).toLocaleDateString('es-VE'):'día 5'}</strong>.</div><div className="button-row" style={{justifyContent:'center'}}><Link href={`/pago?client=${done.client.id}`} className="btn btn-primary">Ver pago y activación</Link><Link href="/master" className="btn btn-secondary">Volver al Master</Link></div></div></div></main>;
 return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link href="/master" className="btn btn-secondary">Volver</Link></div><div className="demo-head"><span className="eyebrow"><Sparkles size={15}/> 5 días gratis</span><h1>Crear nueva prueba TURNAVIA</h1><p className="muted">Registra un médico o clínica para que aparezca inmediatamente en tu Panel Master.</p></div><section className="profile-card"><div className="form"><div className="field"><label>Tipo de cuenta</label><select value={type} onChange={e=>setType(e.target.value)}><option>Médico independiente</option><option>Clínica / consultorio</option></select></div><div className="field"><label>Nombre profesional o de la clínica</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Dra. Ana Pérez / Clínica Salud"/></div><div className="field"><label>Especialidad o tipo de centro</label><input value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})} placeholder="Cardiología"/></div><div className="row" style={{alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>WhatsApp</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="0412-0000000"/></div><div className="field" style={{flex:1}}><label>Correo administrador</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></div></div>{error&&<div className="notice danger">{error}</div>}<div className="notice">{type==='Médico independiente'?<><strong>5 días gratis.</strong><br/>Después: USD 25 activación + USD 15 primer mes = <strong>USD 40 inicial</strong>. Renovación: USD 15/mes.</>:<><strong>5 días gratis.</strong><br/>Después: USD 100 activación + USD 49 primer mes = <strong>USD 149 inicial</strong>. Renovación: USD 49/mes. Hasta 5 médicos.</>}</div><button className="btn btn-primary" onClick={submit} disabled={loading}>{loading?'Creando prueba...':'Comenzar 5 días gratis'}</button></div></section></div></main>
}
