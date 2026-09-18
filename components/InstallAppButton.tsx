'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type BeforeInstallPromptEvent = Event & { prompt:()=>Promise<void>; userChoice:Promise<{outcome:'accepted'|'dismissed'}> };
export function InstallAppButton(){
  const [event,setEvent]=useState<BeforeInstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone===true;
    setInstalled(standalone);
    const handler=(e:Event)=>{ e.preventDefault(); setEvent(e as BeforeInstallPromptEvent); };
    window.addEventListener('beforeinstallprompt',handler);
    window.addEventListener('appinstalled',()=>setInstalled(true));
    return ()=>window.removeEventListener('beforeinstallprompt',handler);
  },[]);
  if(installed) return <span className="pill">✓ App instalada</span>;
  const click=async()=>{
    if(event){await event.prompt();const r=await event.userChoice;if(r.outcome==='accepted'){setEvent(null);setInstalled(true)};return;}
    const ua=navigator.userAgent.toLowerCase();
    if(/iphone|ipad|ipod/.test(ua)) alert('En iPhone/iPad: abre Compartir y selecciona “Añadir a pantalla de inicio”.');
    else alert('Para instalar TURNAVIA: abre esta página con Chrome o Edge por HTTPS (o localhost), espera unos segundos y vuelve a tocar “Instalar TURNAVIA”. También puedes usar el menú del navegador → Instalar aplicación.');
  };
  return <button className="btn btn-secondary" onClick={click}><Download size={16}/> Instalar TURNAVIA</button>
}
