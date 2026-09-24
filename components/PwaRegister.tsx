'use client';
import { useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

type InstallPromptEvent=Event&{
  prompt:()=>Promise<void>;
  userChoice:Promise<{outcome:'accepted'|'dismissed';platform:string}>;
};

export function PwaRegister(){
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null);
  const [ios,setIos]=useState(false);
  const [installed,setInstalled]=useState(false);
  const [showIosHelp,setShowIosHelp]=useState(false);

  useEffect(()=>{
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js').catch(()=>{});
    }

    const standalone=window.matchMedia('(display-mode: standalone)').matches||
      (window.navigator as Navigator&{standalone?:boolean}).standalone===true;
    setInstalled(standalone);

    const ua=navigator.userAgent.toLowerCase();
    setIos(/iphone|ipad|ipod/.test(ua)&&!standalone);

    const before=(event:Event)=>{
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const done=()=>{setInstalled(true);setPromptEvent(null);setShowIosHelp(false)};

    window.addEventListener('beforeinstallprompt',before);
    window.addEventListener('appinstalled',done);
    return ()=>{
      window.removeEventListener('beforeinstallprompt',before);
      window.removeEventListener('appinstalled',done);
    };
  },[]);

  async function install(){
    if(promptEvent){
      await promptEvent.prompt();
      const choice=await promptEvent.userChoice.catch(()=>null);
      if(choice?.outcome==='accepted')setInstalled(true);
      setPromptEvent(null);
      return;
    }
    if(ios)setShowIosHelp(true);
  }

  if(installed||(!promptEvent&&!ios))return null;

  return <>
    <button
      type="button"
      onClick={install}
      aria-label="Instalar TUCITA"
      className="btn btn-primary"
      style={{position:'fixed',right:16,bottom:18,zIndex:80,boxShadow:'0 12px 34px rgba(0,0,0,.18)',borderRadius:999}}
    >
      <Download size={17}/> Instalar TUCITA
    </button>

    {showIosHelp&&<div className="modal-backdrop" style={{zIndex:100}} onClick={()=>setShowIosHelp(false)}>
      <div className="modal" style={{maxWidth:430}} onClick={e=>e.stopPropagation()}>
        <div className="row space" style={{gap:12}}>
          <div><span className="eyebrow">INSTALAR TUCITA</span><h2 style={{marginBottom:4}}>En iPhone o iPad</h2></div>
          <button type="button" className="btn btn-secondary" aria-label="Cerrar" onClick={()=>setShowIosHelp(false)}><X size={16}/></button>
        </div>
        <div className="notice" style={{marginTop:14}}>
          <strong>1.</strong> Abre TUCITA en Safari.<br/>
          <strong>2.</strong> Toca el botón <Share2 size={15} style={{verticalAlign:'middle'}}/> <strong>Compartir</strong>.<br/>
          <strong>3.</strong> Elige <strong>Agregar a pantalla de inicio</strong>.<br/>
          <strong>4.</strong> Confirma <strong>Agregar</strong>.
        </div>
        <p className="muted" style={{fontSize:13}}>TUCITA aparecerá como una app en tu pantalla de inicio y abrirá sin la barra normal del navegador.</p>
      </div>
    </div>}
  </>;
}
