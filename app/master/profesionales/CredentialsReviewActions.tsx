'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BadgeCheck, XCircle } from 'lucide-react';

export default function CredentialsReviewActions({
  slug,
  status,
  hasCredentials
}:{slug:string;status:string;hasCredentials:boolean}){
  const router=useRouter();
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function review(decision:'APPROVED'|'REJECTED'){
    if(busy||!hasCredentials)return;
    const action=decision==='APPROVED'?'aprobar':'rechazar';
    if(!window.confirm(`¿Seguro que deseas ${action} las credenciales declaradas por este profesional?`))return;
    setBusy(decision);setMsg(decision==='APPROVED'?'Aprobando credenciales…':'Marcando credenciales para corrección…');
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),12000);
    try{
      const r=await fetch('/api/master/professionals',{
        method:'PATCH',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({action:'credential_review',slug,decision}),
        signal:controller.signal
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo actualizar la revisión.');return}
      setMsg(decision==='APPROVED'?'Credenciales aprobadas correctamente.':'Credenciales devueltas para corrección.');
      setBusy('');
      router.refresh();
    }catch(error:any){
      setMsg(error?.name==='AbortError'?'La revisión tardó demasiado. Intenta nuevamente; no hace falta recargar toda la página.':'No se pudo conectar con TUCITA.');
    }finally{
      window.clearTimeout(timer);
      setBusy('');
    }
  }

  if(!hasCredentials)return <span className="muted" style={{fontSize:12}}>Sin credenciales cargadas</span>;

  return <div>
    <div className="row" style={{gap:7,flexWrap:'wrap'}}>
      <span className={
        status==='APPROVED'?'status ok':
        status==='REJECTED'?'status bad':
        status==='PENDING'?'status warn':'status'
      }>
        {status==='APPROVED'?'Credenciales aprobadas':
         status==='REJECTED'?'Requiere corrección':
         status==='PENDING'?'Pendiente de revisión':'Sin revisar'}
      </span>
      <button className="btn btn-secondary" onClick={()=>review('APPROVED')} disabled={!!busy||status==='APPROVED'}><BadgeCheck size={14}/>{busy==='APPROVED'?'Procesando…':'Aprobar'}</button>
      <button className="btn btn-secondary" onClick={()=>review('REJECTED')} disabled={!!busy}><XCircle size={14}/>{busy==='REJECTED'?'Procesando…':'Corregir'}</button>
    </div>
    {msg&&<div className="notice" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
