'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wrench } from 'lucide-react';

export default function RepairFinalUserButton({authUserId,email,name}:{authUserId:string;email:string;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function repair(){
    if(busy)return;
    if(!window.confirm('¿Reparar la cuenta de '+name+'?\n\nCorreo: '+email+'\n\nSe conservará su acceso y TUCITA reconstruirá el registro de usuario final que falte.'))return;
    setBusy(true);setMsg('Reparando usuario…');
    try{
      const r=await fetch('/api/master/repair-final-user',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({authUserId})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo reparar el usuario.');return}
      setMsg('Usuario sincronizado correctamente.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div>
    <button className="btn btn-primary" type="button" onClick={repair} disabled={busy} aria-busy={busy}>
      {!busy&&<Wrench size={14}/>}
      {busy?'Reparando…':'Reparar usuario'}
    </button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
