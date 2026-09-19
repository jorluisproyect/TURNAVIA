'use client';
import { useEffect,useState } from 'react';
import { CreditCard, Plus, Power, PowerOff } from 'lucide-react';

export function PaymentMethodsManager({scope,slug='sofia-mendoza'}:{scope:'MASTER'|'DOCTOR';slug?:string}){
  const [methods,setMethods]=useState<any[]>([]);
  const [form,setForm]=useState({name:'',type:'OTRO',accountLabel:'',accountValue:'',instructions:'',currency:'USD',requiresProof:true});
  const [show,setShow]=useState(false);
  async function load(){const r=await fetch(`/api/payment-methods?scope=${scope}&slug=${slug}`);const j=await r.json();setMethods(j.methods||[])}
  useEffect(()=>{load()},[scope,slug]);
  async function add(){if(!form.name)return;await fetch('/api/payment-methods',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scope,slug,...form})});setForm({name:'',type:'OTRO',accountLabel:'',accountValue:'',instructions:'',currency:'USD',requiresProof:true});setShow(false);load()}
  async function toggle(m:any){await fetch('/api/payment-methods',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id,active:!m.active})});load()}
  return <section className="panel" style={{marginTop:18}}>
    <div className="row space"><div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>{scope==='MASTER'?'Cómo pagan profesionales y negocios a TURNAVIA.':'Solo los métodos activos se muestran a tus clientes.'}</div></div><button className="btn btn-primary" onClick={()=>setShow(!show)}><Plus size={16}/> Agregar método</button></div>
    {show&&<div className="form" style={{marginTop:16}}>
      <div className="row" style={{alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Pago móvil / PayPal / Binance"/></div><div className="field" style={{flex:1}}><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>PAYPAL</option><option>BINANCE</option><option>PAGO_MOVIL</option><option>TRANSFERENCIA</option><option>ZELLE</option><option>OTRO</option></select></div></div>
      <div className="row" style={{alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Etiqueta</label><input value={form.accountLabel} onChange={e=>setForm({...form,accountLabel:e.target.value})} placeholder="UID / correo / banco"/></div><div className="field" style={{flex:1}}><label>Dato de pago</label><input value={form.accountValue} onChange={e=>setForm({...form,accountValue:e.target.value})} placeholder="Dato que verá el usuario"/></div></div>
      <div className="field"><label>Instrucciones</label><textarea rows={3} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></div>
      <label className="row" style={{fontSize:13}}><input type="checkbox" checked={form.requiresProof} onChange={e=>setForm({...form,requiresProof:e.target.checked})}/> Requiere comprobante o referencia</label>
      <button className="btn btn-primary" onClick={add}>Guardar método</button>
    </div>}
    <div style={{display:'grid',gap:10,marginTop:16}}>{methods.map(m=><div key={m.id} className="appointment"><div className="iconbox"><CreditCard size={17}/></div><div style={{flex:1}}><strong>{m.name}</strong><div className="muted" style={{fontSize:12}}>{m.account_label||m.accountLabel}: {m.account_value||m.accountValue}</div><div className="muted" style={{fontSize:12}}>{m.instructions}</div></div><span className={m.active?'status ok':'status'}>{m.active?'Activo':'Inactivo'}</span><button className="btn btn-secondary" onClick={()=>toggle(m)}>{m.active?<><PowerOff size={14}/> Desactivar</>:<><Power size={14}/> Activar</>}</button></div>)}</div>
  </section>
}
