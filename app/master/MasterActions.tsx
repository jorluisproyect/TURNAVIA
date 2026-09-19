'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

type ClientStatus='TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';

export default function MasterActions({id,status}:{id:string;status:ClientStatus}){
  const router=useRouter();
  async function setStatus(next:ClientStatus,rejectionReason?:string){
    const r=await fetch('/api/clients',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status:next,rejectionReason})});
    const j=await r.json();
    if(!r.ok){alert(j?.error||'No se pudo actualizar');return}
    router.refresh();
  }
  async function reject(){
    const reason=window.prompt('Motivo del rechazo:','Referencia, monto o comprobante no válido.');
    if(reason===null)return;
    await setStatus('PAGO_PENDIENTE',reason||'Pago rechazado.');
  }
  return <div className="button-row">
    {status==='REVISION_BINANCE'&&<><button className="btn btn-primary" onClick={()=>setStatus('ACTIVO')}>Aprobar pago</button><button className="btn btn-danger" onClick={reject}><XCircle size={15}/> Rechazar</button></>}
    {status==='TRIAL'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Cobrar</Link>}
    {status==='PAGO_PENDIENTE'&&<Link className="btn btn-secondary" href={`/pago?client=${id}`}>Reintentar pago</Link>}
    {status==='ACTIVO'&&<button className="btn btn-danger" onClick={()=>setStatus('SUSPENDIDO')}>Suspender</button>}
    {status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setStatus('ACTIVO')}>Reactivar</button>}
  </div>;
}
