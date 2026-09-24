'use client';
import { useEffect,useTransition } from 'react';
import { RefreshCcw } from 'lucide-react';

export default function MasterError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  const [pending,startTransition]=useTransition();
  useEffect(()=>{console.error('TUCITA Master error',error)},[error]);

  function retry(){
    if(pending)return;
    startTransition(()=>reset());
  }

  return <main className="demo-chooser">
    <div className="container booking-wrap">
      <div className="profile-card" style={{marginTop:40}}>
        <h1>No pudimos cargar el Panel Master</h1>
        <p className="muted">No se aplicó ninguna acción desde esta pantalla. Puedes intentar cargar nuevamente los datos.</p>
        <button className="btn btn-primary" onClick={retry} disabled={pending} aria-busy={pending}>
          {!pending&&<RefreshCcw size={16}/>}
          {pending?'Reintentando…':'Reintentar'}
        </button>
      </div>
    </div>
  </main>;
}
