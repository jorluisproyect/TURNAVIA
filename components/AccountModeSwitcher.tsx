'use client';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, BriefcaseBusiness, UserRound, X } from 'lucide-react';

export function AccountModeSwitcher({
  current,
  compact=false,
  floating=false
}:{current:'DOCTOR'|'PATIENT';compact?:boolean;floating?:boolean}){
  const [caps,setCaps]=useState<any>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [confirmOpen,setConfirmOpen]=useState(false);

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
  const isDoctor=current==='DOCTOR';
  const label=isDoctor?'Cambiar a modo cliente':'Cambiar a modo profesional';
  const currentLabel=isDoctor?'Profesional':'Cliente';
  const targetLabel=isDoctor?'Cliente':'Profesional';

  async function changeMode(){
    if(busy)return;
    setBusy(true);
    setMsg(isDoctor?'Preparando tu modo cliente…':'Volviendo a tu modo profesional…');
    try{
      const r=await fetch('/api/account/mode',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({mode:target})
      });
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo cambiar de modo.');return}
      setMsg('✓ Cambio realizado. Entrando a modo '+targetLabel.toLowerCase()+'…');
      setTimeout(()=>window.location.assign(j.redirect||'/panel'),650);
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  if(floating){
    return <>
      <button
        type="button"
        className="account-mode-floating"
        onClick={()=>{setMsg('');setConfirmOpen(true)}}
        aria-label={label}
      >
        <span className="account-mode-floating-icon"><ArrowLeftRight size={20}/></span>
        <span className="account-mode-floating-copy">
          <small>Estás en modo {currentLabel}</small>
          <strong>{label}</strong>
        </span>
      </button>

      {confirmOpen&&<div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cambiar modo de cuenta">
        <div className="modal account-mode-modal">
          <div className="row space" style={{gap:14,alignItems:'flex-start'}}>
            <div className="account-mode-modal-icon">{isDoctor?<UserRound size={24}/>:<BriefcaseBusiness size={24}/>}</div>
            <button type="button" className="mobile-sheet-close" aria-label="Cerrar" onClick={()=>!busy&&setConfirmOpen(false)}><X size={19}/></button>
          </div>
          <div style={{marginTop:14}}>
            <div className="muted" style={{fontSize:12,fontWeight:800,letterSpacing:'.04em'}}>CAMBIAR DE CUENTA</div>
            <h2 style={{margin:'6px 0 8px'}}>Pasar a modo {targetLabel}</h2>
            <p className="muted" style={{margin:0,lineHeight:1.55}}>
              {isDoctor
                ?'Podrás explorar y reservar servicios con otros profesionales usando el mismo correo. Tu perfil profesional, agenda y suscripción permanecen intactos.'
                :'Volverás a tu panel profesional con tus servicios, agenda, pagos y configuración.'}
            </p>
          </div>
          {msg&&<div className="notice" style={{marginTop:14}} role="status">{msg}</div>}
          <div className="button-row" style={{marginTop:18}}>
            <button type="button" className="btn btn-primary" onClick={changeMode} disabled={busy}>
              <ArrowLeftRight size={16}/>{busy?'Cambiando…':'Sí, cambiar a '+targetLabel.toLowerCase()}
            </button>
            <button type="button" className="btn btn-secondary" onClick={()=>setConfirmOpen(false)} disabled={busy}>Cancelar</button>
          </div>
        </div>
      </div>}
    </>;
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
      {isDoctor?<UserRound size={18}/>:<BriefcaseBusiness size={18}/>}
      {busy?'Cambiando…':label}
    </button>
    {msg&&<div style={{fontSize:11,color:'#c7dbd8',padding:'0 10px'}} role="status">{msg}</div>}
  </div>;
}
