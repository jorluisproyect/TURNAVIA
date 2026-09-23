'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';

export default function MasterActions({id,status}:{id:string;status:ClientStatus}){
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
  return <div>
    <div className="button-row">
      {status==='REVISION_BINANCE'&&<><button className="btn btn-primary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Aprobar pago'}</button><button className="btn btn-danger" disabled={busy} onClick={reject}><XCircle size={15}/> {busy?'Procesando…':'Rechazar'}</button></>}
      {status==='TRIAL'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Cobrar</Link>}
      {(status==='TRIAL'||status==='PAGO_PENDIENTE')&&<button className="btn btn-secondary" disabled={busy} onClick={extendTrial}>{busy?'Procesando…':'+15 días de prueba'}</button>}
      {status==='PAGO_PENDIENTE'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Reintentar pago</Link>}
      {status==='ACTIVO'&&<button className="btn btn-danger" disabled={busy} onClick={()=>setStatus('SUSPENDIDO')}>{busy?'Procesando…':'Suspender'}</button>}
      {status==='SUSPENDIDO'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Reactivar'}</button>}
    </div>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:8,fontSize:12}}>{msg}</div>}
  </div>;
}
