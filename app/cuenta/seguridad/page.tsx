'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Brand } from '@/components/Brand';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SeguridadCuenta(){
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(newPassword.length<8){setError('La nueva contraseña debe tener al menos 8 caracteres.');return}
    if(newPassword!==confirm){setError('Las contraseñas nuevas no coinciden.');return}
    setBusy(true);setError('');
    try{
      const {error}=await authClient.changePassword({currentPassword,newPassword,revokeOtherSessions:true});
      if(error){setError(error.message||'No se pudo cambiar la contraseña.');return}
      setDone(true);setCurrentPassword('');setNewPassword('');setConfirm('');
    }catch{setError('No se pudo completar el cambio.')}
    finally{setBusy(false)}
  }

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/panel" className="btn btn-secondary">Volver a mi panel</Link></div>
    <div className="demo-head"><span className="eyebrow"><ShieldCheck size={15}/> Seguridad</span><h1>Contraseña y acceso</h1><p className="muted">Cambia tu contraseña y cierra las demás sesiones por seguridad.</p></div>
    <section className="profile-card">
      {done&&<div className="notice"><CheckCircle2 size={16}/> Contraseña actualizada correctamente.</div>}
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Contraseña actual</label><input type="password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></div>
        <div className="field"><label>Nueva contraseña</label><input type="password" required minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></div>
        <div className="field"><label>Repite la nueva contraseña</label><input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
        {error&&<div className="notice danger">{error}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy?'Actualizando...':'Cambiar contraseña'}</button>
      </form>
    </section>
  </div></main>;
}
