'use client';
import { useEffect, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

export function AccountModeSwitcher({
  current,
  compact=false,
  iconOnly=false
}:{current:'DOCTOR'|'PATIENT';compact?:boolean;iconOnly?:boolean}){
  const [caps,setCaps]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    let active=true;
    fetch('/api/account/mode',{cache:'no-store'})
      .then(r=>r.json())
      .then(j=>{if(active)setCaps(j)})
      .catch(()=>{});
    return ()=>{active=false};
  },[]);

  const show=current==='DOCTOR' ? Boolean(caps?.canActivateClient) : Boolean(caps?.hasProfessional);
  if(!show)return null;

  const target=current==='DOCTOR'?'PATIENT':'DOCTOR';
  const targetLabel=current==='DOCTOR'?'cliente':'profesional';
  const label='Cambiar a modo '+targetLabel;

  async function changeMode(){
    if(busy)return;
    setBusy(true);
    setMsg('Cambiando…');
    try{
      const r=await fetch('/api/account/mode',{
        method:'POST',
        cache:'no-store',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({mode:target})
      });
      const j=await r.json();
      if(!r.ok){
        setMsg(j.error||'No se pudo cambiar de modo.');
        return;
      }
      window.location.replace(j.redirect||'/panel');
    }catch{
      setMsg('No se pudo conectar con TUCITA.');
    }finally{
      setBusy(false);
    }
  }

  if(iconOnly){
    return <button
      type="button"
      className="account-mode-icon-button"
      onClick={changeMode}
      disabled={busy}
      title={label}
      aria-label={label}
      aria-busy={busy}
    >
      <ArrowLeftRight size={16}/>
    </button>;
  }

  if(compact){
    return <div style={{display:'grid',gap:6}}>
      <button type="button" className="btn btn-secondary" onClick={changeMode} disabled={busy}>
        <ArrowLeftRight size={15}/>{busy?'Cambiando…':label}
      </button>
      {msg&&<small className="muted" role="status">{msg}</small>}
    </div>;
  }

  return <button type="button" className="btn btn-secondary" onClick={changeMode} disabled={busy}>
    <ArrowLeftRight size={16}/>{busy?'Cambiando…':label}
  </button>;
}
