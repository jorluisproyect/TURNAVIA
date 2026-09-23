'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

type Kind='client'|'professional'|'commercial';

export function DeleteProfileButton({accountKind,subscriptionActive=false}:{accountKind:Kind;subscriptionActive?:boolean}){
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function remove(){
    if(busy)return;
    const label=accountKind==='client'?'Cliente':accountKind==='commercial'?'Comercial':'Profesional';
    const first=window.confirm(`Vas a eliminar tu perfil ${label}. Dejará de estar activo y visible en TUCITA. ¿Deseas continuar?`);
    if(!first)return;

    const secondText=subscriptionActive
      ? 'SEGUNDA CONFIRMACIÓN\n\nTu suscripción está activa. Si eliminas tu perfil, perderás la suscripción actual y, si el Master restablece la cuenta, tendrás que activarla o pagar nuevamente.\n\n¿Seguro que quieres eliminar tu perfil?'
      : 'SEGUNDA CONFIRMACIÓN\n\n¿Seguro que quieres eliminar tu perfil? El Master será el único que podrá restablecerlo.';
    if(!window.confirm(secondText))return;

    setBusy(true);
    setMsg('Eliminando perfil…');
    try{
      const r=await fetch('/api/account/profile',{method:'DELETE'});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo eliminar el perfil.');return}
      setMsg(j.message||'Perfil eliminado correctamente.');
      try{await authClient.signOut()}catch{}
      window.setTimeout(()=>{window.location.href='/ingresar?perfil=eliminado'},900);
    }catch{
      setMsg('No se pudo conectar con TUCITA. Intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  return <div className="danger-zone">
    <div>
      <strong>Eliminar mi perfil</strong>
      <p>Esta acción oculta y desactiva tu cuenta. Tus datos se conservan únicamente para que el Master pueda restablecerla.</p>
      {subscriptionActive&&<div className="notice danger" style={{marginTop:10}}>Tienes una suscripción activa. Si eliminas tu perfil, <strong>perderás esa suscripción</strong>.</div>}
    </div>
    <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}><Trash2 size={16}/>{busy?' Eliminando…':' Eliminar mi perfil'}</button>
    {msg&&<div className="notice" role="status" aria-live="polite" style={{marginTop:10}}>{msg}</div>}
  </div>;
}
