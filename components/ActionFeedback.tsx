'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';

type ActionKind='saving'|'success'|'error';
type Feedback={kind:ActionKind;message:string;id:number};
const EVENT='tucita:action-feedback';

export function showActionFeedback(kind:ActionKind,message:string){
  if(typeof window==='undefined')return;
  window.dispatchEvent(new CustomEvent(EVENT,{detail:{kind,message}}));
}

/** Every mutation can use this lock: a second tap is ignored until the first finishes. */
export function useActionLock(){
  const inflight=useRef(false);
  const [busy,setBusy]=useState(false);
  async function run<T>(work:()=>Promise<T>):Promise<T|undefined>{
    if(inflight.current)return undefined;
    inflight.current=true;
    setBusy(true);
    try{return await work()}finally{inflight.current=false;setBusy(false)}
  }
  return {busy,run};
}

/** One prominent, accessible confirmation for the entire application. */
export function ActionFeedback(){
  const [feedback,setFeedback]=useState<Feedback|null>(null);
  const nextId=useRef(0);
  const clearTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{
    function onFeedback(event:Event){
      const detail=(event as CustomEvent<{kind:ActionKind;message:string}>).detail;
      if(!detail||!['saving','success','error'].includes(detail.kind)||!detail.message)return;
      if(clearTimer.current)clearTimeout(clearTimer.current);
      setFeedback({kind:detail.kind,message:detail.message,id:++nextId.current});
      if(detail.kind!=='saving'){
        clearTimer.current=setTimeout(()=>setFeedback(null),detail.kind==='error'?6500:4600);
      }
    }
    window.addEventListener(EVENT,onFeedback);
    return ()=>{
      window.removeEventListener(EVENT,onFeedback);
      if(clearTimer.current)clearTimeout(clearTimer.current);
    };
  },[]);

  if(!feedback)return null;
  const Icon=feedback.kind==='saving'?LoaderCircle:feedback.kind==='error'?AlertCircle:CheckCircle2;
  return <div className={'tucita-action-feedback '+feedback.kind}
    role={feedback.kind==='error'?'alert':'status'}
    aria-live={feedback.kind==='error'?'assertive':'polite'} aria-atomic="true">
    <span className="tucita-action-feedback-icon"><Icon size={23} className={feedback.kind==='saving'?'tucita-action-spin':''}/></span>
    <div className="tucita-action-feedback-copy">
      <strong>{feedback.kind==='saving'?'Procesando…':feedback.kind==='error'?'No se completó la acción':'¡Listo!'}</strong>
      <span>{feedback.message}</span>
    </div>
    {feedback.kind!=='saving'&&<button type="button" aria-label="Cerrar aviso" onClick={()=>setFeedback(null)}><X size={18}/></button>}
  </div>;
}
