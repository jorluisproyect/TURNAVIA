'use client';
import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';

export default function ClientEmailActions({id,active}:{id:string;active:boolean}){
  const {busy,run}=useActionLock();

  async function send(kind:'welcome'|'activation'){
    await run(async()=>{
      showActionFeedback('saving',kind==='welcome'?'Enviando bienvenida…':'Enviando correo de activación…');
      try{
        const r=await fetch('/api/clients/email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,kind})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo enviar el correo.');return}
        showActionFeedback('success',kind==='welcome'?'Correo de bienvenida enviado correctamente.':'Correo de activación enviado correctamente.');
      }catch{showActionFeedback('error','No se pudo conectar con el servicio de correo.')}
    });
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button className="btn btn-secondary" onClick={()=>send('welcome')} disabled={busy}><Mail size={15}/>{busy?' Enviando…':' Reenviar bienvenida'}</button>
      {active&&<button className="btn btn-secondary" onClick={()=>send('activation')} disabled={busy}><RefreshCw size={15}/>{busy?' Enviando…':' Reenviar activación'}</button>}
    </div>
  </div>;
}
