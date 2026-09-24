'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';

export function ReportProviderButton({slug}:{slug:string}){
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState('');
  const [email,setEmail]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');

  async function send(){
    if(reason.trim().length<10){setMessage('Describe brevemente el motivo del reporte.');return}
    setBusy(true);setMessage('Enviando reporte…');
    try{
      const r=await fetch('/api/public/report',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,reason,email})});
      const j=await r.json();
      if(!r.ok){setMessage(j.error||'No se pudo enviar el reporte.');return}
      setMessage('Reporte recibido. TUCITA lo revisará.');setReason('');
    }catch{setMessage('No se pudo conectar con TUCITA.');}
    finally{setBusy(false)}
  }

  return <div style={{marginTop:16}}>
    {!open?<button type="button" className="btn btn-secondary" onClick={()=>setOpen(true)}><Flag size={15}/> Reportar perfil o servicio</button>:<div className="notice" style={{display:'grid',gap:10}}>
      <strong>Reportar contenido o servicio</strong>
      <textarea rows={3} maxLength={600} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Explica qué contenido o servicio incumple las normas de TUCITA."/>
      <input type="email" maxLength={200} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Tu correo (opcional)"/>
      <div className="row" style={{gap:8,flexWrap:'wrap'}}><button type="button" className="btn btn-primary" disabled={busy} onClick={send}>{busy?'Enviando…':'Enviar reporte'}</button><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button></div>
      {message&&<small className="muted">{message}</small>}
    </div>}
  </div>;
}
