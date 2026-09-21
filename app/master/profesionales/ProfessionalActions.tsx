'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Power, PowerOff, Trash2 } from 'lucide-react';

export default function ProfessionalActions({slug,active,name}:{slug:string;active:boolean;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function toggle(){
    setBusy('toggle');setMsg('');
    try{
      const r=await fetch('/api/master/professionals',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({slug,active:!active})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo actualizar.');return}
      router.refresh();
    }finally{setBusy('')}
  }

  async function remove(){
    const ok=window.confirm(`¿Eliminar definitivamente a "${name}"? Esta opción solo funcionará si no tiene historial real de citas ni pagos.`);
    if(!ok)return;
    setBusy('delete');setMsg('');
    try{
      const r=await fetch('/api/master/professionals',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({slug})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar.');return}
      router.refresh();
    }finally{setBusy('')}
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button className="btn btn-secondary" onClick={toggle} disabled={!!busy}>{active?<><PowerOff size={14}/> Desactivar</>:<><Power size={14}/> Reactivar</>}</button>
      <button className="btn btn-danger" onClick={remove} disabled={!!busy}><Trash2 size={14}/> Eliminar</button>
    </div>
    {msg&&<div className="notice danger" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
