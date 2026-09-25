'use client';
import { useState } from 'react';
import { BellRing, Send } from 'lucide-react';

function base64UrlToUint8Array(value:string){
  const padding='='.repeat((4-value.length%4)%4);
  const base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=window.atob(base64);
  return Uint8Array.from([...raw].map(ch=>ch.charCodeAt(0)));
}

export default function PushNotificationsButton(){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function enable(){
    if(busy)return;
    setBusy(true);setMsg('Preparando notificaciones…');
    try{
      if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){
        setMsg('Este navegador no admite notificaciones push de TUCITA.');
        return;
      }
      const configRes=await fetch('/api/push/subscribe',{cache:'no-store'});
      const config=await configRes.json();
      if(!configRes.ok){setMsg(config.error||'No se pudo verificar la configuración.');return}
      if(!config.ready||!config.publicKey){
        setMsg('Falta activar las claves de notificación en Vercel. TUCITA ya está preparada para usarlas.');
        return;
      }
      const permission=await Notification.requestPermission();
      if(permission!=='granted'){setMsg('Debes permitir las notificaciones del navegador para recibir avisos en el teléfono.');return}
      const reg=await navigator.serviceWorker.ready;
      let subscription=await reg.pushManager.getSubscription();
      if(!subscription){
        subscription=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:base64UrlToUint8Array(config.publicKey)
        });
      }
      const r=await fetch('/api/push/subscribe',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({subscription:subscription.toJSON()})
      });
      const j=await r.json();
      setMsg(r.ok?'Notificaciones activadas en este teléfono.':(j.error||'No se pudieron activar.'));
    }catch{
      setMsg('No se pudieron activar las notificaciones en este teléfono.');
    }finally{setBusy(false)}
  }

  async function test(){
    if(busy)return;
    setBusy(true);setMsg('Enviando prueba…');
    try{
      const r=await fetch('/api/push/subscribe',{method:'PUT'});
      const j=await r.json();
      setMsg(r.ok&&j.ok?'Prueba enviada. Revisa la notificación de tu teléfono.':(j.reason==='NO_SUBSCRIPTIONS'?'Primero activa las notificaciones en este teléfono.':'No se pudo enviar la prueba.'));
    }catch{setMsg('No se pudo enviar la prueba.')}
    finally{setBusy(false)}
  }

  return <div>
    <div className="button-row" style={{flexWrap:'wrap'}}>
      <button type="button" className="btn btn-primary" onClick={enable} disabled={busy}><BellRing size={16}/>{busy?' Procesando…':' Activar en este teléfono'}</button>
      <button type="button" className="btn btn-secondary" onClick={test} disabled={busy}><Send size={16}/> Enviar prueba</button>
    </div>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:10}}>{msg}</div>}
  </div>;
}
