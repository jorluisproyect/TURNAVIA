'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Brand } from '@/components/Brand';
import { CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { passwordIssues, PASSWORD_HELP } from '@/lib/password-policy';

export default function SeguridadCuenta(){
  const router=useRouter();
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [showCurrent,setShowCurrent]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [showConfirm,setShowConfirm]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');

  async function submit(e:React.FormEvent){
    e.preventDefault();
    const issues=passwordIssues(newPassword);
    if(issues.length){setError('La nueva contraseña necesita '+issues.join(', ')+'.');return}
    if(newPassword!==confirm){setError('Las contraseñas nuevas no coinciden.');return}
    setBusy(true);setError('');
    try{
      const {error}=await authClient.changePassword({currentPassword,newPassword,revokeOtherSessions:true});
      if(error){setError(error.message||'No se pudo cambiar la contraseña.');return}
      await fetch('/api/account/password-changed',{method:'POST'});
      setDone(true);setCurrentPassword('');setNewPassword('');setConfirm('');
      setTimeout(()=>{router.replace('/panel');router.refresh()},900);
    }catch{setError('No se pudo completar el cambio.')}
    finally{setBusy(false)}
  }

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/panel" className="btn btn-secondary">Volver a mi panel</Link></div>
    <div className="demo-head"><span className="eyebrow"><ShieldCheck size={15}/> Seguridad</span><h1>Contraseña y acceso</h1><p className="muted">Cambia tu contraseña y cierra las demás sesiones por seguridad. Si el sistema te envió aquí al entrar como Master, debes completar este cambio antes de abrir el panel administrativo.</p></div>
    <section className="profile-card">
      {done&&<div className="notice"><CheckCircle2 size={16}/> Contraseña actualizada correctamente.</div>}
      <form className="form" onSubmit={submit}>
        <div className="field"><label>Contraseña actual</label><div style={{position:'relative'}}><input type={showCurrent?'text':'password'} required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} style={{paddingRight:46}}/><button type="button" aria-label={showCurrent?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowCurrent(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showCurrent?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
        <div className="field"><label>Nueva contraseña</label><div style={{position:'relative'}}><input type={showNew?'text':'password'} required minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{paddingRight:46}}/><button type="button" aria-label={showNew?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowNew(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showNew?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><div className="muted" style={{fontSize:12,marginTop:6}}>{PASSWORD_HELP}</div></div>
        <div className="field"><label>Repite la nueva contraseña</label><div style={{position:'relative'}}><input type={showConfirm?'text':'password'} required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} style={{paddingRight:46}}/><button type="button" aria-label={showConfirm?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowConfirm(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showConfirm?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
        {error&&<div className="notice danger">{error}</div>}
        <button className="btn btn-primary" disabled={busy} aria-busy={busy}>{busy?'Actualizando...':'Cambiar contraseña'}</button>
      </form>
    </section>
  </div></main>;
}
