'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseZap, ShieldAlert } from 'lucide-react';

export default function ResetTucitaDataButton(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function reset(){
    if(busy)return;

    if(!window.confirm('¿Blanquear TODOS los datos de TUCITA?\n\nSe eliminarán clientes, profesionales, negocios, citas, pagos, suscripciones, servicios, horarios, notificaciones e historial. Tu cuenta Master se conservará.')){
      return;
    }

    if(!window.confirm('SEGUNDA CONFIRMACIÓN\n\nEsta acción dejará las métricas y la base operativa en 0. Los usuarios eliminados tendrán que crearse nuevamente.\n\n¿Seguro que quieres continuar?')){
      return;
    }

    const typed=window.prompt('CONFIRMACIÓN FINAL\n\nEscribe exactamente: BLANQUEAR TUCITA','');
    if(typed!=='BLANQUEAR TUCITA'){
      if(typed!==null)setMsg('Operación cancelada: debes escribir BLANQUEAR TUCITA exactamente.');
      return;
    }

    setBusy(true);
    setMsg('Blanqueando TUCITA… no cierres esta pantalla.');
    try{
      const r=await fetch('/api/master/reset-data',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({confirmation:'BLANQUEAR TUCITA'})
      });
      const j=await r.json();
      if(!r.ok){
        setMsg((j.error||'No se pudo blanquear TUCITA.')+(j.technicalDetail?` Detalle: ${j.technicalDetail}`:''));
        return;
      }
      const c=j.counts||{};
      const base=`Listo. Clientes: ${c.clients??0} · Profesionales: ${c.professionals??0} · Clientes finales: ${c.patients??0} · Citas: ${c.appointments??0}. Cuenta Master conservada.`;
      setMsg(j.warning?base+' '+j.warning:base);
      router.refresh();
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div className="danger-zone">
    <div>
      <strong><DatabaseZap size={17} style={{verticalAlign:'middle',marginRight:7}}/>Blanquear datos de TUCITA</strong>
      <p>Deja clientes, profesionales, negocios, citas, pagos, suscripciones y métricas en 0. Conserva únicamente tu cuenta Master y sus métodos de cobro.</p>
      <div className="notice danger" style={{marginTop:10}}>
        <ShieldAlert size={17}/><span><strong>Acción destructiva.</strong><br/>Los usuarios deberán registrarse nuevamente después del blanqueo.</span>
      </div>
    </div>
    <button type="button" className="btn btn-danger" onClick={reset} disabled={busy}>
      <DatabaseZap size={16}/>{busy?' Blanqueando…':' Blanquear todo'}
    </button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:10}}>{msg}</div>}
  </div>;
}
