'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, XCircle } from 'lucide-react';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';

export default function MasterActions({id,status,showDeleteSubscription=false,name='esta cuenta'}:{id:string;status:ClientStatus;showDeleteSubscription?:boolean;name?:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const busyRef=useRef(false);
  async function setStatus(next:ClientStatus,rejectionReason?:string){
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setMsg('Procesando cambio…');
    try{
      const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:next,rejectionReason})});
      const j=await r.json();
      if(!r.ok){setMsg(j?.error||'No se pudo actualizar.');return}
      setMsg('Cambio realizado correctamente.');router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }
  async function extendTrial(){
    if(!window.confirm('¿Agregar 15 días a la prueba de esta cuenta?'))return;
    if(busyRef.current)return;
    busyRef.current=true;setBusy(true);setMsg('Actualizando período de prueba…');
    try{
      const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,extendTrialDays:15})});
      const j=await r.json();
      if(!r.ok){setMsg(j?.error||'No se pudo extender la prueba.');return}
      setMsg('Se agregaron 15 días correctamente.');router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }
  async function reject(){
    const reason=window.prompt('Motivo del rechazo:','Referencia, monto o comprobante no válido.');
    if(reason===null)return;
    await setStatus('PAGO_PENDIENTE',reason||'Pago rechazado.');
  }

  async function deleteSubscription(){
    if(busyRef.current)return;
    const first=window.confirm(`¿Eliminar la suscripción de "${name}"?\n\nEsto NO elimina el perfil, las citas ni el historial del usuario.`);
    if(!first)return;
    const consequence=status==='ACTIVO'
      ? 'La cuenta perderá su suscripción ACTIVA y el acceso de pago inmediatamente.'
      : status==='TRIAL'
        ? 'La cuenta perderá inmediatamente el período de prueba.'
        : status==='REVISION_BINANCE'
          ? 'El pago dejará de estar en revisión y la cuenta volverá a Pago pendiente.'
          : 'La suscripción quedará eliminada y la cuenta pasará a Pago pendiente.';
    const second=window.confirm(`SEGUNDA CONFIRMACIÓN\n\n${consequence}\n\n¿Seguro que quieres eliminar esta suscripción?`);
    if(!second)return;

    busyRef.current=true;setBusy(true);setMsg('Eliminando suscripción…');
    try{
      const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,deleteSubscription:true})});
      const j=await r.json();
      if(!r.ok){setMsg(j?.error||'No se pudo eliminar la suscripción.');return}
      setMsg('Suscripción eliminada correctamente. La cuenta quedó en Pago pendiente.');
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      busyRef.current=false;setBusy(false);
    }
  }
  return <div>
    <div className="button-row">
      {status==='REVISION_BINANCE'&&<><button className="btn btn-primary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Aprobar pago'}</button><button className="btn btn-danger" disabled={busy} onClick={reject}><XCircle size={15}/> {busy?'Procesando…':'Rechazar'}</button></>}
      {status==='TRIAL'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Cobrar</Link>}
      {(status==='TRIAL'||status==='PAGO_PENDIENTE')&&<button className="btn btn-secondary" disabled={busy} onClick={extendTrial}>{busy?'Procesando…':'+15 días de prueba'}</button>}
      {status==='PAGO_PENDIENTE'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Reintentar pago</Link>}
      {status==='ACTIVO'&&<button className="btn btn-danger" disabled={busy} onClick={()=>setStatus('SUSPENDIDO')}>{busy?'Procesando…':'Suspender'}</button>}
      {status==='SUSPENDIDO'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Reactivar'}</button>}
      {showDeleteSubscription&&status!=='PAGO_PENDIENTE'&&<button className="btn btn-danger" disabled={busy} onClick={deleteSubscription} title="Eliminar la suscripción actual sin borrar el perfil"><Trash2 size={15}/> {busy?'Procesando…':'Eliminar'}</button>}
    </div>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
