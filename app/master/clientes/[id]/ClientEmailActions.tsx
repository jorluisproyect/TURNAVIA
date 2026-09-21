'use client';
import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';

export default function ClientEmailActions({id,active}:{id:string;active:boolean}){
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function send(kind:'welcome'|'activation'){
    setBusy(kind);setMsg('');
    try{
      const r=await fetch('/api/clients/email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,kind})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo enviar el correo.');return}
      setMsg(kind==='welcome'?'Correo de bienvenida reenviado.':'Correo de activación reenviado.');
    }catch{
      setMsg('No se pudo conectar con el servicio de correo.');
    }finally{setBusy('')}
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button className="btn btn-secondary" onClick={()=>send('welcome')} disabled={!!busy}><Mail size={15}/>{busy==='welcome'?' Enviando...':' Reenviar bienvenida'}</button>
      {active&&<button className="btn btn-secondary" onClick={()=>send('activation')} disabled={!!busy}><RefreshCw size={15}/>{busy==='activation'?' Enviando...':' Reenviar activación'}</button>}
    </div>
    {msg&&<div className="notice" style={{marginTop:10}}>{msg}</div>}
  </div>;
}
