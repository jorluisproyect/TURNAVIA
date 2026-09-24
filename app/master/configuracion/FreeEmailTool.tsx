'use client';
import { useState } from 'react';
import { Eraser } from 'lucide-react';

export default function FreeEmailTool(){
  const [email,setEmail]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [ok,setOk]=useState(false);

  async function free(){
    if(busy)return;
    const normalized=email.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(normalized)){
      setOk(false);setMsg('Escribe un correo válido.');return;
    }
    if(!window.confirm(
      '¿Liberar por completo '+normalized+'?\n\nSe eliminarán su acceso, perfil y datos operativos vinculados. Después podrá registrarse nuevamente con el mismo correo.'
    ))return;
    const typed=window.prompt('CONFIRMACIÓN FINAL\n\nEscribe exactamente: LIBERAR','');
    if(typed!=='LIBERAR'){
      if(typed!==null){setOk(false);setMsg('Operación cancelada: debes escribir LIBERAR exactamente.');}
      return;
    }
    setBusy(true);setOk(false);setMsg('Liberando correo… espera un momento.');
    try{
      const r=await fetch('/api/master/free-email',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({email:normalized,confirmation:'LIBERAR'})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo liberar el correo.');return}
      setOk(true);
      setMsg('Correo liberado correctamente. Ya puede registrarse de nuevo como Cliente o Profesional.');
      setEmail('');
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div className="danger-zone">
    <div>
      <strong>Liberar correo para volver a registrarlo</strong>
      <p>Úsalo cuando una cuenta fue eliminada pero el correo todavía aparece como utilizado. Borra los residuos de perfil y autenticación y verifica que el correo quede disponible.</p>
    </div>
    <div className="field">
      <label>Correo a liberar</label>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@correo.com" disabled={busy}/>
    </div>
    <button type="button" className="btn btn-danger" onClick={free} disabled={busy||!email.trim()} aria-busy={busy}>
      {!busy&&<Eraser size={16}/>}
      {busy?'Liberando…':'Liberar correo'}
    </button>
    {msg&&<div className={ok?'notice':'notice danger'} role="status" aria-live="polite">{msg}</div>}
  </div>;
}
