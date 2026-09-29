'use client';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, BriefcaseBusiness, UserRound } from 'lucide-react';

export function AccountModeSwitcher({current,compact=false}:{current:'DOCTOR'|'PATIENT';compact?:boolean}){
  const [caps,setCaps]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    let active=true;
    fetch('/api/account/mode')
      .then(r=>r.json())
      .then(j=>{if(active)setCaps(j)})
      .catch(()=>{});
    return ()=>{active=false};
  },[]);

  const show=current==='DOCTOR' ? Boolean(caps?.canActivateClient) : Boolean(caps?.hasProfessional);
  if(!show)return null;

  const target=current==='DOCTOR'?'PATIENT':'DOCTOR';
  const label=current==='DOCTOR'?'Cambiar a modo cliente':'Cambiar a modo profesional';

  async function changeMode(){
    if(busy)return;
    setBusy(true);
    setMsg(current==='DOCTOR'?'Preparando tu modo cliente…':'Volviendo a tu modo profesional…');
    try{
      const r=await fetch('/api/account/mode',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({mode:target})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo cambiar de modo.');return}
      window.location.assign(j.redirect||'/panel');
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  if(compact){
    return <div style={{display:'grid',gap:6}}>
      <button type="button" className="btn btn-secondary" onClick={changeMode} disabled={busy}>
        <ArrowLeftRight size={15}/>{busy?'Cambiando…':label}
      </button>
      {msg&&<small className="muted" role="status">{msg}</small>}
    </div>;
  }

  return <div style={{display:'grid',gap:6}}>
    <button type="button" className="side-link account-mode-switch" onClick={changeMode} disabled={busy} style={{width:'100%',border:'1px solid rgba(255,255,255,.14)',background:'rgba(255,255,255,.06)',cursor:'pointer'}}>
      {current==='DOCTOR'?<UserRound size={18}/>:<BriefcaseBusiness size={18}/>}
      {busy?'Cambiando…':label}
    </button>
    {msg&&<div style={{fontSize:11,color:'#c7dbd8',padding:'0 10px'}} role="status">{msg}</div>}
  </div>;
}
