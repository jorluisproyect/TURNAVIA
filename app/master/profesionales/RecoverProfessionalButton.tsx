'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function RecoverProfessionalButton({authUserId,email,name}:{authUserId:string;email:string;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function recover(){
    if(busy)return;
    const ok=window.confirm(
      '¿Restaurar a '+name+' como profesional?\n\nCorreo: '+email+'\n\nConservará su acceso actual y recibirá 15 días completos de prueba desde hoy.'
    );
    if(!ok)return;
    setBusy(true);
    setMsg('Restaurando profesional…');
    try{
      const r=await fetch('/api/master/recover-professional',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({authUserId})
      });
      const j=await r.json();
      if(!r.ok){
        setMsg(j.error||'No se pudo restaurar el profesional.');
        return;
      }
      setMsg('Profesional restaurado con 15 días de prueba.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div>
    <button className="btn btn-primary" type="button" onClick={recover} disabled={busy}>
      <RotateCcw size={15}/>{busy?' Restaurando…':' Restaurar profesional'}
    </button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
