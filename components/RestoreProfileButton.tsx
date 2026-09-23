'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';

export function RestoreProfileButton({email,name,professional}:{email:string;name:string;professional:boolean}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function restore(){
    if(busy)return;
    if(!window.confirm(`¿Restablecer el perfil de "${name}"? ${professional?'La cuenta profesional volverá a existir, pero su suscripción anterior NO se recuperará.':'El usuario podrá volver a entrar a TUCITA.'}`))return;
    setBusy(true);setMsg('Restableciendo perfil…');
    try{
      const r=await fetch('/api/account/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo restablecer el perfil.');return}
      setMsg(professional?'Perfil restablecido. Requiere nueva activación o pago.':'Perfil restablecido correctamente.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{setBusy(false)}
  }

  return <div>
    <button className="btn btn-primary" type="button" onClick={restore} disabled={busy}><RotateCcw size={15}/>{busy?' Restableciendo…':' Restablecer'}</button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
