'use client';
import { useState } from 'react';
import { MailCheck } from 'lucide-react';

export default function EmailTestButton(){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [ok,setOk]=useState(false);

  async function test(){
    setBusy(true);setMsg('');setOk(false);
    try{
      const r=await fetch('/api/email/test',{method:'POST'});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo enviar el correo de prueba.');return}
      setOk(true);setMsg('Correo de prueba enviado al correo Master. Revisa también Spam/Promociones.');
    }catch{
      setMsg('No se pudo conectar con el servicio de correo.');
    }finally{setBusy(false)}
  }

  return <div>
    <button className="btn btn-secondary" onClick={test} disabled={busy}><MailCheck size={15}/>{busy?' Enviando prueba...':' Enviar correo de prueba'}</button>
    {msg&&<div className={ok?'notice':'notice danger'} style={{marginTop:10}}>{msg}</div>}
  </div>;
}
