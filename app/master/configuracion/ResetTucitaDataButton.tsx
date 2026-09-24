'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Trash2 } from 'lucide-react';

export default function ResetTucitaDataButton(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function reset(){
    if(busy)return;

    if(!window.confirm(
      '¿ELIMINAR TODO y dejar TUCITA en 0?\n\nSe eliminarán clientes, profesionales, equipo, negocios, citas, pagos, suscripciones, servicios, horarios, notificaciones, invitaciones e historial.\n\nSolo se conservará tu cuenta Master y los métodos generales de cobro.'
    ))return;

    if(!window.confirm(
      'SEGUNDA CONFIRMACIÓN\n\nProfesionales: 0\nEquipo: 0\nClientes: 0\nCitas: 0\nPagos y suscripciones: 0\n\nLos usuarios tendrán que registrarse nuevamente. ¿Seguro que deseas continuar?'
    ))return;

    const typed=window.prompt(
      'CONFIRMACIÓN FINAL\n\nEscribe exactamente: ELIMINAR TODO',
      ''
    );
    if(typed!=='ELIMINAR TODO'){
      if(typed!==null)setMsg('Operación cancelada: debes escribir ELIMINAR TODO exactamente.');
      return;
    }

    setBusy(true);
    setMsg('Eliminando todos los datos… no cierres esta pantalla.');
    try{
      const r=await fetch('/api/master/reset-data',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({confirmation:'ELIMINAR TODO'})
      });
      const j=await r.json();
      if(!r.ok){
        setMsg((j.error||'No se pudo reiniciar TUCITA.')+(j.technicalDetail?(' Detalle: '+j.technicalDetail):''));
        return;
      }
      const c=j.counts||{};
      const base='Sistema en 0. Clientes: '+(c.clients??0)+' · Profesionales: '+(c.professionals??0)+' · Equipo: '+(c.team??0)+' · Citas: '+(c.appointments??0)+'. Solo tu Master fue conservado.';
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
      <strong><Trash2 size={17} style={{verticalAlign:'middle',marginRight:7}}/>Eliminar TODO</strong>
      <p>Restablece TUCITA a cero para comenzar nuevamente con usuarios reales. Deja profesionales, equipo, clientes, citas, pagos, suscripciones y métricas en 0.</p>
      <div className="notice danger" style={{marginTop:10}}>
        <ShieldAlert size={17}/><span><strong>Acción destructiva y exclusiva del Master.</strong><br/>Solo se conserva tu cuenta Master y los métodos generales de cobro.</span>
      </div>
    </div>
    <button type="button" className="btn btn-danger" onClick={reset} disabled={busy}>
      <Trash2 size={16}/>{busy?' Eliminando TODO…':' Eliminar TODO'}
    </button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:10}}>{msg}</div>}
  </div>;
}
