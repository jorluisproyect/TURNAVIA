'use client';
import { useEffect,useRef,useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, RefreshCcw } from 'lucide-react';

export default function MasterRefreshControl(){
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  const [updated,setUpdated]=useState(false);
  const requested=useRef(false);

  useEffect(()=>{
    if(pending){
      requested.current=true;
      setUpdated(false);
      return;
    }
    if(requested.current){
      requested.current=false;
      setUpdated(true);
      const timer=window.setTimeout(()=>setUpdated(false),1800);
      return ()=>window.clearTimeout(timer);
    }
  },[pending]);

  function refresh(){
    if(pending)return;
    setUpdated(false);
    startTransition(()=>router.refresh());
  }

  return <div className="master-refresh-dock" role="region" aria-label="Actualizar datos del Master">
    <button
      type="button"
      className="btn btn-secondary master-refresh-button"
      onClick={refresh}
      disabled={pending}
      aria-busy={pending}
    >
      {!pending&&<RefreshCcw size={16}/>}
      {pending?'Actualizando…':'Actualizar'}
    </button>
    {updated&&<span className="master-refresh-ok" role="status" aria-live="polite"><CheckCircle2 size={14}/> Actualizado</span>}
  </div>;
}
