'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Power, PowerOff, Trash2 } from 'lucide-react';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';

export default function ProfessionalActions({slug,active,name}:{slug:string;active:boolean;name:string}){
  const router=useRouter();
  const {busy,run}=useActionLock();
  const [msg,setMsg]=useState('');

  async function toggle(){
    await run(async()=>{
      setMsg('');showActionFeedback('saving',active?'Desactivando profesional…':'Reactivando profesional…');
      try{
        const r=await fetch('/api/master/professionals',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({slug,active:!active})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo actualizar.');return}
        showActionFeedback('success',active?'Profesional desactivado correctamente.':'Profesional reactivado correctamente.');
        router.refresh();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  async function remove(){
    if(busy)return;
    const ok=window.confirm(`¿Eliminar definitivamente a "${name}"? Esta opción solo funcionará si no tiene historial real de citas ni pagos.`);
    if(!ok)return;
    await run(async()=>{
      setMsg('');showActionFeedback('saving','Eliminando profesional…');
      try{
        const r=await fetch('/api/master/professionals',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({slug})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo eliminar.');return}
        showActionFeedback('success','Profesional eliminado correctamente.');
        router.refresh();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button className="btn btn-secondary" onClick={toggle} disabled={busy}>{busy?'Procesando…':active?<><PowerOff size={14}/> Desactivar</>:<><Power size={14}/> Reactivar</>}</button>
      <button className="btn btn-danger" onClick={remove} disabled={busy}><Trash2 size={14}/> {busy?'Procesando…':'Eliminar'}</button>
    </div>
    {msg&&<div className="notice danger" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
