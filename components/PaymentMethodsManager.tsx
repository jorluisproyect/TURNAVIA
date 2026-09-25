'use client';
import { useEffect,useMemo,useRef,useState } from 'react';
import { CreditCard, Plus, Power, PowerOff, Pencil, Trash2, X } from 'lucide-react';

const blank={name:'Pago móvil',type:'PAGO_MOVIL',accountLabel:'Datos de Pago Móvil',accountValue:'',instructions:'',currency:'VES',requiresProof:true,bank:'',phone:'',idNumber:'',accountNumber:'',holder:'',email:'',uid:''};

function lineValue(value:string,label:string){
  const m=String(value||'').match(new RegExp('(?:^|\\n)'+label+':\\s*(.+)','i'));
  return m?.[1]?.trim()||'';
}

function methodPreset(type:string){
  if(type==='PAGO_MOVIL')return {name:'Pago móvil',accountLabel:'Datos de Pago Móvil',currency:'VES'};
  if(type==='TRANSFERENCIA')return {name:'Transferencia bancaria',accountLabel:'Datos de transferencia',currency:'VES'};
  if(type==='BINANCE')return {name:'Binance',accountLabel:'UID Binance',currency:'USDT'};
  return {name:'PayPal',accountLabel:'Correo PayPal',currency:'USD'};
}

export function PaymentMethodsManager({scope,slug='sofia-mendoza',country='Venezuela'}:{scope:'MASTER'|'DOCTOR';slug?:string;country?:string}){
  const [methods,setMethods]=useState<any[]>([]);
  const [form,setForm]=useState(blank);
  const [show,setShow]=useState(false);
  const [editingId,setEditingId]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);
  const busyRef=useRef(false);
  const venezuela=String(country||'').trim().toLowerCase()==='venezuela';
  const allowedTypes=useMemo(()=>scope==='DOCTOR'&&!venezuela?['PAYPAL','BINANCE']:['PAGO_MOVIL','TRANSFERENCIA','PAYPAL','BINANCE'],[scope,venezuela]);

  async function load(){
    const r=await fetch(`/api/payment-methods?scope=${scope}&slug=${slug}`);
    const j=await r.json();
    const list=(j.methods||[]).filter((m:any)=>scope!=='DOCTOR'||venezuela||['PAYPAL','BINANCE'].includes(String(m.type)));
    setMethods(list);
    if(!r.ok)setMsg(j.error||'No se pudieron cargar los métodos de pago.');
  }
  useEffect(()=>{load()},[scope,slug,country]);

  function reset(){
    const type=allowedTypes[0]||'PAYPAL';
    setForm({...blank,type,...methodPreset(type),accountValue:'',bank:'',phone:'',idNumber:'',accountNumber:'',holder:'',email:'',uid:'',instructions:''});
    setEditingId('');setShow(false);
  }

  async function save(){
    let payload:any={...form};
    if(form.type==='PAGO_MOVIL'){
      if(!form.bank.trim()||!form.phone.trim()||!form.idNumber.trim())return setMsg('Completa banco, teléfono y cédula del Pago Móvil.');
      payload={...form,...methodPreset('PAGO_MOVIL'),accountValue:'Banco: '+form.bank.trim()+'\nTeléfono: '+form.phone.trim()+'\nCédula: '+form.idNumber.trim(),instructions:form.instructions.trim()||'Realiza el Pago Móvil, guarda la referencia y sube el comprobante.',requiresProof:true};
    }else if(form.type==='TRANSFERENCIA'){
      if(!form.bank.trim()||!form.accountNumber.trim())return setMsg('Completa banco y número de cuenta.');
      payload={...form,...methodPreset('TRANSFERENCIA'),accountValue:'Banco: '+form.bank.trim()+'\nCuenta: '+form.accountNumber.trim()+(form.holder.trim()?'\nTitular: '+form.holder.trim():'')+(form.idNumber.trim()?'\nDocumento: '+form.idNumber.trim():''),instructions:form.instructions.trim()||'Realiza la transferencia, guarda la referencia y sube el comprobante.',requiresProof:true};
    }else if(form.type==='BINANCE'){
      if(!form.uid.trim())return setMsg('Escribe el UID de Binance.');
      payload={...form,...methodPreset('BINANCE'),accountValue:form.uid.trim(),instructions:form.instructions.trim()||'Envía el pago por Binance, copia el ID/TxID y sube el comprobante.',requiresProof:true};
    }else{
      if(!/^\S+@\S+\.\S+$/.test(form.email.trim()))return setMsg('Escribe un correo PayPal válido.');
      payload={...form,...methodPreset('PAYPAL'),accountValue:form.email.trim().toLowerCase(),instructions:form.instructions.trim()||'Envía el pago a este correo PayPal, guarda el ID de la operación y sube el comprobante.',requiresProof:true};
    }
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setMsg('Guardando método de pago…');
    const wasEditing=Boolean(editingId);
    try{
      const method=editingId?'PATCH':'POST';
      const body=editingId?{id:editingId,...payload}:{scope,slug,...payload};
      const r=await fetch('/api/payment-methods',{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo guardar.');return}
      reset();await load();setMsg(wasEditing?'Método actualizado correctamente.':'Método agregado correctamente.');
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }

  function edit(m:any){
    setEditingId(m.id);
    const type=['PAGO_MOVIL','TRANSFERENCIA','BINANCE','PAYPAL'].includes(String(m.type))?String(m.type):'PAYPAL';
    const value=String(m.account_value??m.accountValue??'');
    setForm({
      ...blank,
      ...methodPreset(type),
      name:m.name||methodPreset(type).name,
      type,
      accountLabel:m.account_label??m.accountLabel??methodPreset(type).accountLabel,
      accountValue:value,
      instructions:m.instructions||'',
      currency:m.currency||methodPreset(type).currency,
      requiresProof:true,
      bank:lineValue(value,'Banco'),
      phone:lineValue(value,'Teléfono')||lineValue(value,'Telefono'),
      idNumber:lineValue(value,'Cédula')||lineValue(value,'Cedula')||lineValue(value,'Documento'),
      accountNumber:lineValue(value,'Cuenta'),
      holder:lineValue(value,'Titular'),
      email:type==='PAYPAL'?value:'',
      uid:type==='BINANCE'?value:''
    });
    setShow(true);
    setMsg('');
  }

  async function toggle(m:any){
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setMsg(m.active?'Desactivando método…':'Activando método…');
    try{
      const r=await fetch('/api/payment-methods',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id,active:!m.active})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo actualizar.');return}
      await load();setMsg(m.active?'Método desactivado correctamente.':'Método activado correctamente.');
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }

  async function remove(m:any){
    if(!confirm(`¿Eliminar definitivamente el método "${m.name}"?`))return;
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setMsg('Eliminando método…');
    try{
      const r=await fetch('/api/payment-methods',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:m.id})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar.');return}
      if(editingId===m.id)reset();
      await load();setMsg('Método eliminado correctamente.');
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }

  return <section className="panel" style={{marginTop:18}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
      <div><h2>Métodos de pago</h2><div className="muted" style={{fontSize:13}}>{scope==='MASTER'?'Cómo pagan profesionales y negocios a TUCITA.':venezuela?'En Venezuela puedes ofrecer Pago Móvil, transferencia, PayPal y Binance.':'Para este país TUCITA habilita únicamente PayPal y Binance.'}</div></div>
      <button className="btn btn-primary" onClick={()=>{if(show)reset();else{const type=allowedTypes[0]||'PAYPAL';setEditingId('');setForm({...blank,type,...methodPreset(type)});setShow(true)}}}>{show?<><X size={16}/> Cerrar</>:<><Plus size={16}/> Agregar método</>}</button>
    </div>

    {show&&<div className="form" style={{marginTop:16}}>
      <div className="notice"><strong>{editingId?'Editando método':'Nuevo método de pago'}</strong><br/><span className="muted">TUCITA te pedirá únicamente los datos necesarios para ese método.</span></div>

      <div className="field"><label>Tipo de pago</label><select value={form.type} disabled={Boolean(editingId)} onChange={e=>{const type=e.target.value;setForm({...blank,type,...methodPreset(type)})}}>
        {allowedTypes.includes('PAGO_MOVIL')&&<option value="PAGO_MOVIL">Pago Móvil</option>}
        {allowedTypes.includes('TRANSFERENCIA')&&<option value="TRANSFERENCIA">Transferencia bancaria</option>}
        {allowedTypes.includes('PAYPAL')&&<option value="PAYPAL">PayPal</option>}
        {allowedTypes.includes('BINANCE')&&<option value="BINANCE">Binance</option>}
      </select></div>

      {form.type==='PAGO_MOVIL'&&<>
        <div className="field"><label>Banco</label><input value={form.bank} onChange={e=>setForm({...form,bank:e.target.value})} placeholder="Ej. Banco de Venezuela"/></div>
        <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
          <div className="field" style={{flex:1,minWidth:210}}><label>Número de teléfono</label><input inputMode="numeric" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value.replace(/\D/g,'')})} placeholder="04121234567"/></div>
          <div className="field" style={{flex:1,minWidth:210}}><label>Cédula / documento</label><input value={form.idNumber} onChange={e=>setForm({...form,idNumber:e.target.value})} placeholder="V-12345678"/></div>
        </div>
      </>}

      {form.type==='TRANSFERENCIA'&&<>
        <div className="field"><label>Banco</label><input value={form.bank} onChange={e=>setForm({...form,bank:e.target.value})} placeholder="Nombre del banco"/></div>
        <div className="field"><label>Número de cuenta</label><input inputMode="numeric" value={form.accountNumber} onChange={e=>setForm({...form,accountNumber:e.target.value.replace(/\s/g,'')})} placeholder="Número completo de cuenta"/></div>
        <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
          <div className="field" style={{flex:1,minWidth:210}}><label>Titular (opcional)</label><input value={form.holder} onChange={e=>setForm({...form,holder:e.target.value})}/></div>
          <div className="field" style={{flex:1,minWidth:210}}><label>Documento (opcional)</label><input value={form.idNumber} onChange={e=>setForm({...form,idNumber:e.target.value})}/></div>
        </div>
      </>}

      {form.type==='PAYPAL'&&<div className="field"><label>Correo de PayPal</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="correo@ejemplo.com"/></div>}
      {form.type==='BINANCE'&&<div className="field"><label>UID de Binance</label><input inputMode="numeric" value={form.uid} onChange={e=>setForm({...form,uid:e.target.value.replace(/\s/g,'')})} placeholder="UID de Binance"/></div>}

      <div className="field"><label>Instrucciones adicionales (opcional)</label><textarea rows={3} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Ej. Coloca tu nombre en el concepto y conserva la referencia."/></div>
      <div className="notice"><strong>Seguridad del cobro</strong><br/>El cliente verá estos datos, ingresará referencia y comprobante, y la reserva quedará en revisión hasta que apruebes el pago.</div>
      <div className="button-row"><button className="btn btn-primary" onClick={save} disabled={busy}>{busy?'Guardando…':editingId?'Guardar cambios':'Guardar método'}</button>{editingId&&<button className="btn btn-secondary" onClick={reset}>Cancelar</button>}</div>
    </div>}

    {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}

    <div style={{display:'grid',gap:10,marginTop:16}}>{methods.map(m=><div key={m.id} className="appointment" style={{gap:10,flexWrap:'wrap'}}>
      <div className="iconbox"><CreditCard size={17}/></div>
      <div style={{flex:1,minWidth:220}}><strong>{m.name}</strong><div className="muted" style={{fontSize:12,whiteSpace:'pre-line'}}>{m.account_label||m.accountLabel}: {m.account_value||m.accountValue}</div><div className="muted" style={{fontSize:12}}>{m.instructions}</div></div>
      <span className={m.active?'status ok':'status'}>{m.active?'Activo':'Inactivo'}</span>
      <button className="btn btn-secondary" onClick={()=>edit(m)}><Pencil size={14}/> Editar</button>
      <button className="btn btn-secondary" onClick={()=>toggle(m)} disabled={busy}>{m.active?<><PowerOff size={14}/> {busy?'Procesando…':'Desactivar'}</>:<><Power size={14}/> {busy?'Procesando…':'Activar'}</>}</button>
      <button className="btn btn-secondary" onClick={()=>remove(m)} disabled={busy}><Trash2 size={14}/> {busy?'Procesando…':'Eliminar'}</button>
    </div>)}</div>
  </section>
}
