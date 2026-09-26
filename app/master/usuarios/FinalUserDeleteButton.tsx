'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function FinalUserDeleteButton({email,name}:{email:string;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function remove(){
    if(busy)return;
    if(!window.confirm(`¿Mover a "${name}" a Perfiles eliminados? Podrás restaurarlo después desde Master.`))return;
    setBusy(true);setMsg('Moviendo a perfiles eliminados…');
    try{
      const r=await fetch('/api/master/users',{
        method:'DELETE',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({email})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar.');return}
      setMsg('Usuario movido a Perfiles eliminados.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA.');
    }finally{setBusy(false)}
  }

  return <div>
    <button type="button" className="btn btn-danger" onClick={remove} disabled={busy} title="Mover a Perfiles eliminados" aria-label={'Eliminar perfil de '+name}>
      <Trash2 size={15}/>{busy?' Procesando…':' Eliminar'}
    </button>
    {msg&&<div className="notice" style={{marginTop:7,fontSize:11}}>{msg}</div>}
  </div>;
}
