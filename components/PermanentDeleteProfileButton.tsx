'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Trash2 } from 'lucide-react';

export function PermanentDeleteProfileButton({email,name}:{email:string;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function removeForever(){
    if(busy)return;

    const first=window.confirm(
      `¿Eliminar por completo el perfil de "${name}"?\n\nEsta acción es definitiva. Se borrarán el perfil, acceso, citas y datos operativos asociados a esta cuenta.`
    );
    if(!first)return;

    const second=window.confirm(
      'SEGUNDA CONFIRMACIÓN\n\nDespués de continuar NO podrás restablecer este usuario desde TUCITA.\n\n¿Seguro que quieres eliminarlo por completo del sistema?'
    );
    if(!second)return;

    const typed=window.prompt('CONFIRMACIÓN FINAL\n\nEscribe ELIMINAR para borrar definitivamente esta cuenta:','');
    if(typed!=='ELIMINAR'){
      if(typed!==null)setMsg('Eliminación cancelada: debes escribir ELIMINAR exactamente.');
      return;
    }

    setBusy(true);
    setMsg('Eliminando por completo…');
    try{
      const r=await fetch('/api/account/profile',{
        method:'PUT',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({email,confirmation:'ELIMINAR'})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar por completo.');return}
      setMsg('Perfil eliminado por completo.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div>
    <button type="button" className="btn btn-danger" onClick={removeForever} disabled={busy}>
      {busy?<ShieldAlert size={15}/>:<Trash2 size={15}/>}
      {busy?' Eliminando…':' Eliminar por completo'}
    </button>
    {msg&&<div className="notice danger" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
