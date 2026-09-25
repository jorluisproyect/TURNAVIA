'use client';

import { useState } from 'react';
import { Megaphone } from 'lucide-react';

export default function BroadcastUpdateTool(){
  const [message,setMessage]=useState('TUCITA fue actualizada con nuevas mejoras para hacer más fácil gestionar tus servicios, pagos y clientes. Entra a tu panel para revisarlas.');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');

  async function send(){
    if(busy)return;
    if(!message.trim()){setStatus('Escribe el mensaje de la actualización.');return}
    if(!confirm('¿Enviar esta actualización a todos los profesionales registrados?'))return;
    setBusy(true);setStatus('Enviando actualización…');
    try{
      const r=await fetch('/api/master/broadcast-update',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({title:'Actualización TUCITA',message,link:'/medico'})
      });
      const j=await r.json();
      setStatus(r.ok?(j.message||'Actualización enviada.'):(j.error||'No se pudo enviar.'));
    }catch{
      setStatus('No se pudo conectar con TUCITA.');
    }finally{setBusy(false)}
  }

  return <div className="form">
    <div className="field">
      <label>Mensaje para profesionales</label>
      <textarea rows={4} value={message} onChange={e=>setMessage(e.target.value)} maxLength={900}/>
      <small className="muted">Aparecerá en la campana de Notificaciones de cada profesional. Puedes usarlo después de cada mejora importante.</small>
    </div>
    <button type="button" className="btn btn-primary" onClick={send} disabled={busy}>
      <Megaphone size={16}/>{busy?' Enviando…':' Enviar actualización'}
    </button>
    {status&&<div className="notice" role="status" aria-live="polite" style={{marginTop:10}}>{status}</div>}
  </div>;
}
