'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { showActionFeedback, useActionLock } from '@/components/ActionFeedback';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';

export default function MasterActions({id,status}:{id:string;status:ClientStatus}){
  const router=useRouter();
  const {busy,run}=useActionLock();

  async function setStatus(next:ClientStatus,rejectionReason?:string){
    await run(async()=>{
      const saving=next==='ACTIVO'?'Actualizando la suscripción…':next==='SUSPENDIDO'?'Suspendiendo la cuenta…':'Guardando el estado de la cuenta…';
      showActionFeedback('saving',saving);
      try{
        const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:next,rejectionReason})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo actualizar la cuenta.');return}
        const message=rejectionReason?'Pago rechazado. El cliente deberá corregir el comprobante.':next==='ACTIVO'?'Cuenta activada correctamente.':next==='SUSPENDIDO'?'Cuenta suspendida correctamente.':'Estado actualizado correctamente.';
        showActionFeedback('success',message);
        router.refresh();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA. Intenta de nuevo.')}
    });
  }

  async function extendTrial(){
    if(busy||!window.confirm('¿Agregar 15 días a la prueba de esta cuenta?'))return;
    await run(async()=>{
      showActionFeedback('saving','Extendiendo la prueba…');
      try{
        const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,extendTrialDays:15})});
        const j=await r.json();
        if(!r.ok){showActionFeedback('error',j.error||'No se pudo extender la prueba.');return}
        showActionFeedback('success','La prueba se extendió 15 días correctamente.');
        router.refresh();
      }catch{showActionFeedback('error','No se pudo conectar con TUCITA.')}
    });
  }

  async function reject(){
    if(busy)return;
    const reason=window.prompt('Motivo del rechazo:','Referencia, monto o comprobante no válido.');
    if(reason===null)return;
    await setStatus('PAGO_PENDIENTE',reason||'Pago rechazado.');
  }

  return <div className="button-row">
    {status==='REVISION_BINANCE'&&<><button className="btn btn-primary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Aprobar pago'}</button><button className="btn btn-danger" disabled={busy} onClick={reject}><XCircle size={15}/> Rechazar</button></>}
    {status==='TRIAL'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Cobrar</Link>}
    {(status==='TRIAL'||status==='PAGO_PENDIENTE')&&<button className="btn btn-secondary" disabled={busy} onClick={extendTrial}>{busy?'Procesando…':'+15 días de prueba'}</button>}
    {status==='PAGO_PENDIENTE'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Reintentar pago</Link>}
    {status==='ACTIVO'&&<button className="btn btn-danger" disabled={busy} onClick={()=>setStatus('SUSPENDIDO')}>{busy?'Procesando…':'Suspender'}</button>}
    {status==='SUSPENDIDO'&&<button className="btn btn-secondary" disabled={busy} onClick={()=>setStatus('ACTIVO')}>{busy?'Procesando…':'Reactivar'}</button>}
  </div>;
}
