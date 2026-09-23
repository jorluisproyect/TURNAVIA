'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Power, PowerOff, Trash2 } from 'lucide-react';

export default function ProfessionalActions({slug,active,name}:{slug:string;active:boolean;name:string}){
  const router=useRouter();
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  async function toggle(){
    if(busy)return;
    setBusy('toggle');setMsg(active?'Desactivando profesional…':'Reactivando profesional…');
    try{
      const r=await fetch('/api/master/professionals',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({slug,active:!active})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo actualizar.');return}
      setMsg(active?'Profesional desactivado correctamente.':'Profesional reactivado correctamente.');router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{setBusy('')}
  }

  async function remove(){
    const ok=window.confirm(`¿Eliminar definitivamente a "${name}"? Esta opción solo funcionará si no tiene historial real de citas ni pagos.`);
    if(!ok)return;
    if(busy)return;
    setBusy('delete');setMsg('Eliminando profesional…');
    try{
      const r=await fetch('/api/master/professionals',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({slug})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar.');return}
      setMsg('Profesional eliminado correctamente.');router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{setBusy('')}
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button className="btn btn-secondary" onClick={toggle} disabled={!!busy}>{active?<><PowerOff size={14}/> {busy?'Procesando…':'Desactivar'}</>:<><Power size={14}/> {busy?'Procesando…':'Reactivar'}</>}</button>
      <button className="btn btn-danger" onClick={remove} disabled={!!busy}><Trash2 size={14}/> {busy?'Procesando…':'Eliminar'}</button>
    </div>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
