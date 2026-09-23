'use client';
import { useEffect,useState } from 'react';
import { CreditCard, Plus, Power, PowerOff, Pencil, Trash2, X } from 'lucide-react';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';

const blank={name:'',type:'OTRO',accountLabel:'',accountValue:'',instructions:'',currency:'USD',requiresProof:true};

export function PaymentMethodsManager({scope,slug='sofia-mendoza'}:{scope:'MASTER'|'DOCTOR';slug?:string}){
  const [methods,setMethods]=useState<any[]>([]);
  const [form,setForm]=useState(blank);
  const [show,setShow]=useState(false);
  const [editingId,setEditingId]=useState('');
  const [msg,setMsg]=useState('');
  const {busy,run}=useActionLock();

  async function load(){
    const r=await fetch(`/api/payment-methods?scope=${scope}&slug=${slug}`);
    const j=await r.json();
    setMethods(j.methods||[]);
    if(!r.ok)setMsg(j.error||'No se pudieron cargar los métodos de pago.');
  }
  useEffect(()=>{load()},[scope,slug]);

  function reset(){
    setForm(blank);setEditingId('');setShow(false);
  }

  async function save(){
    if(!form.name.trim()){setMsg('Escribe el nombre del método de pago.');return}
    await run(async()=>{
      setMsg('');
      const wasEditing=Boolean(editingId);
      showActionFeedback('saving',wasEditing?'Actualizando método de pago…':'Guardando método de pago…');
      try{
        const method=wasEditing?'PATCH':'POST';
        const body=wasEditing?{id:editingId,...form}:{scope,slug,...form};
        const r=await fetch('/api/payment-methods',{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo guardar el método de pago.');return}
        reset();
        showActionFeedback('success',wasEditing?'Método de pago actualizado correctamente.':'Método de pago agregado correctamente.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA. Revisa tu conexión.')}
    });
  }

  function edit(m:any){
    setEditingId(m.id);
    setForm({
      name:m.name||'',
      type:m.type||'OTRO',
      accountLabel:m.account_label??m.accountLabel??'',
      accountValue:m.account_value??m.accountValue??'',
      instructions:m.instructions||'',
      currency:m.currency||'USD',
      requiresProof:m.requires_proof??m.requiresProof??true
    });
    setShow(true);
    setMsg('');
  }

  async function toggle(m:any){
    await run(async()=>{
      setMsg('');
      showActionFeedback('saving',m.active?'Desactivando método…':'Activando método…');
      try{
        const r=await fetch('/api/payment-methods',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id,active:!m.active})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo actualizar el método.');return}
        showActionFeedback('success',m.active?'Método de pago desactivado.':'Método de pago activado.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  async function remove(m:any){
    if(!confirm(`¿Eliminar definitivamente el método "${m.name}"?`))return;
    await run(async()=>{
      setMsg('');
      showActionFeedback('saving','Eliminando método de pago…');
      try{
        const r=await fetch('/api/payment-methods',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo eliminar el método.');return}
        if(editingId===m.id)reset();
        showActionFeedback('success','Método de pago eliminado correctamente.');
        await load();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  return <section className="panel" style={{marginTop:18}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
      <div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>{scope==='MASTER'?'Cómo pagan profesionales y negocios a TUCITA.':'Solo los métodos activos se muestran a tus clientes.'}</div></div>
      <button className="btn btn-primary" disabled={busy} onClick={()=>{if(show)reset();else{setEditingId('');setForm(blank);setShow(true)}}}>{show?<><X size={16}/> Cerrar</>:<><Plus size={16}/> Agregar método</>}</button>
    </div>

    {show&&<div className="form" style={{marginTop:16}}>
      <div className="notice"><strong>{editingId?'Editando método':'Nuevo método de pago'}</strong></div>
      <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:220}}><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Pago móvil / PayPal / Binance"/></div><div className="field" style={{flex:1,minWidth:180}}><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>PAYPAL</option><option>BINANCE</option><option>PAGO_MOVIL</option><option>TRANSFERENCIA</option><option>ZELLE</option><option>OTRO</option></select></div></div>
      <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:220}}><label>Etiqueta</label><input value={form.accountLabel} onChange={e=>setForm({...form,accountLabel:e.target.value})} placeholder="UID / correo / banco"/></div><div className="field" style={{flex:1,minWidth:220}}><label>Dato de pago</label><input value={form.accountValue} onChange={e=>setForm({...form,accountValue:e.target.value})} placeholder="Dato que verá el usuario"/></div></div>
      <div className="field"><label>Instrucciones</label><textarea rows={3} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></div>
      <div className="row" style={{gap:12,flexWrap:'wrap'}}>
        <div className="field" style={{minWidth:160}}><label>Moneda</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>USD</option><option>USDT</option><option>VES</option><option>EUR</option></select></div>
        <label className="notice row" style={{fontSize:13,alignSelf:'end'}}><input type="checkbox" checked={form.requiresProof} onChange={e=>setForm({...form,requiresProof:e.target.checked})}/> Requiere comprobante o referencia</label>
      </div>
      <div className="button-row"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?'Guardando…':editingId?'Guardar cambios':'Guardar método'}</button>{editingId&&<button className="btn btn-secondary" onClick={reset} disabled={busy}>Cancelar</button>}</div>
    </div>}

    {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}

    <div style={{display:'grid',gap:10,marginTop:16}}>{methods.map(m=><div key={m.id} className="appointment" style={{gap:10,flexWrap:'wrap'}}>
      <div className="iconbox"><CreditCard size={17}/></div>
      <div style={{flex:1,minWidth:220}}><strong>{m.name}</strong><div className="muted" style={{fontSize:12}}>{m.account_label||m.accountLabel}: {m.account_value||m.accountValue}</div><div className="muted" style={{fontSize:12}}>{m.instructions}</div></div>
      <span className={m.active?'status ok':'status'}>{m.active?'Activo':'Inactivo'}</span>
      <button className="btn btn-secondary" onClick={()=>edit(m)} disabled={busy}><Pencil size={14}/> Editar</button>
      <button className="btn btn-secondary" onClick={()=>toggle(m)} disabled={busy}>{m.active?<><PowerOff size={14}/> Desactivar</>:<><Power size={14}/> Activar</>}</button>
      <button className="btn btn-secondary" onClick={()=>remove(m)} disabled={busy}><Trash2 size={14}/> Eliminar</button>
    </div>)}</div>
  </section>
}
