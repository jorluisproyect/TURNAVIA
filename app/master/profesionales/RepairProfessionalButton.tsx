'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wrench } from 'lucide-react';

export default function RepairProfessionalButton({authUserId,email,name}:{authUserId:string;email:string;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function repair(){
    if(busy)return;
    const ok=window.confirm(
      '¿Reparar el perfil profesional de '+name+'?\n\nCorreo: '+email+'\n\nSe conservará su cuenta de acceso. TUCITA reconstruirá los datos técnicos que faltan.'
    );
    if(!ok)return;
    setBusy(true);
    setMsg('Reparando perfil…');
    try{
      const r=await fetch('/api/master/repair-professional',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({authUserId})
      });
      const j=await r.json();
      if(!r.ok){
        setMsg(j.error||'No se pudo reparar el perfil.');
        return;
      }
      setMsg(j.message||'Perfil reparado correctamente.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div>
    <button type="button" className="btn btn-primary" onClick={repair} disabled={busy}>
      <Wrench size={14}/>{busy?' Reparando…':' Reparar perfil'}
    </button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
