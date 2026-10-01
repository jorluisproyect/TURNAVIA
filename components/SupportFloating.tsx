'use client';
import { useState } from 'react';
import { CircleHelp, Send, X } from 'lucide-react';

export function SupportFloating(){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [form,setForm]=useState({name:'',email:'',subject:'Soporte TUCITA',message:'',website:''});

  async function send(){
    if(busy)return;
    if(!form.name.trim()||!/^\S+@\S+\.\S+$/.test(form.email.trim())||form.message.trim().length<10){
      setMsg('Completa tu nombre, un correo válido y cuéntanos el problema con un poco más de detalle.');
      return;
    }
    setBusy(true);setMsg('Enviando a soporte…');
    try{
      const r=await fetch('/api/support',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(form)
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No pudimos enviar tu mensaje.');return}
      setMsg('✅ Mensaje enviado. Soporte TUCITA lo recibió.');
      setForm({name:'',email:'',subject:'Soporte TUCITA',message:'',website:''});
      setTimeout(()=>{setOpen(false);setMsg('')},2200);
    }catch{
      setMsg('No pudimos conectar con soporte. Intenta nuevamente.');
    }finally{setBusy(false)}
  }

  return <>
    <button
      type="button"
      className="support-fab"
      onClick={()=>setOpen(true)}
      aria-label="Abrir soporte TUCITA"
      title="Ayuda y soporte"
    >
      <CircleHelp size={19}/><span>Ayuda</span>
    </button>

    {open&&<div className="modal-backdrop support-modal-layer" role="dialog" aria-modal="true" aria-label="Soporte TUCITA">
      <div className="modal support-modal">
        <div className="row space" style={{gap:14,alignItems:'flex-start'}}>
          <div>
            <div className="eyebrow"><CircleHelp size={14}/> SOPORTE TUCITA</div>
            <h2 style={{margin:'10px 0 4px'}}>¿En qué te ayudamos?</h2>
            <p className="muted" style={{margin:0,fontSize:13}}>Tu mensaje llega directamente a soporte@tucita.com.ve.</p>
          </div>
          <button type="button" className="mobile-sheet-close" aria-label="Cerrar soporte" onClick={()=>!busy&&setOpen(false)}><X size={19}/></button>
        </div>

        <div className="form" style={{marginTop:18}}>
          <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
            <div className="field" style={{flex:1,minWidth:190}}><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Tu nombre"/></div>
            <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="tu@correo.com"/></div>
          </div>
          <div className="field"><label>Motivo</label><select value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option>Soporte TUCITA</option><option>Problema con una reserva</option><option>Problema con un pago</option><option>Problema con mi cuenta</option><option>Sugerencia</option></select></div>
          <div className="field"><label>Mensaje</label><textarea rows={5} maxLength={2000} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Explícanos qué pasó y, si aplica, indica servicio, fecha y profesional."/></div>
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" className="support-honeypot" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/>
          {msg&&<div className="notice" role="status" aria-live="polite">{msg}</div>}
        </div>

        <div className="button-row" style={{marginTop:18}}>
          <button type="button" className="btn btn-primary" onClick={send} disabled={busy} aria-busy={busy}><Send size={16}/>{busy?'Enviando…':'Enviar a soporte'}</button>
          <button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)} disabled={busy}>Cancelar</button>
        </div>
      </div>
    </div>}
  </>;
}
