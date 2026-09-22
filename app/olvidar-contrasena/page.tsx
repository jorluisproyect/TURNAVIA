'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { authClient } from '@/lib/auth/client';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function OlvidarContrasena(){
  const [email,setEmail]=useState('');
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState('');

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);setError('');
    try{
      const redirectTo=(typeof window!=='undefined'?window.location.origin:'https://turnavia.vercel.app')+'/restablecer-contrasena';
      const {error}=await authClient.requestPasswordReset({email:email.trim().toLowerCase(),redirectTo});
      if(error){setError(error.message||'No se pudo enviar el enlace.');return}
      setSent(true);
    }catch{setError('No se pudo conectar con el servicio de acceso.')}
    finally{setBusy(false)}
  }

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/ingresar" className="btn btn-secondary">Volver a ingresar</Link></div>
    <div className="demo-head"><span className="eyebrow">Recuperar acceso</span><h1>Restablece tu contraseña</h1><p className="muted">Te enviaremos un enlace seguro al correo de tu cuenta TUCITA.</p></div>
    <section className="profile-card">
      {sent?<div style={{textAlign:'center',padding:'20px 4px'}}><CheckCircle2 size={42}/><h2>Revisa tu correo</h2><p className="muted">Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para crear una contraseña nueva.</p><Link href="/ingresar" className="btn btn-primary">Volver a ingresar</Link></div>:
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Correo de tu cuenta</label><div className="row" style={{gap:8}}><Mail size={18}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div></div>
        {error&&<div className="notice danger">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy?'Enviando...':'Enviar enlace de recuperación'}</button>
      </form>}
    </section>
  </div></main>;
}
