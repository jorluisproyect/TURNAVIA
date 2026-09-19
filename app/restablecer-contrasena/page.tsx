'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { authClient } from '@/lib/auth/client';
import { CheckCircle2 } from 'lucide-react';

function ResetContent(){
  const sp=useSearchParams();
  const token=sp.get('token')||'';
  const invalid=sp.get('error');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [error,setError]=useState('');

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(password.length<8){setError('La contraseña debe tener al menos 8 caracteres.');return}
    if(password!==confirm){setError('Las contraseñas no coinciden.');return}
    if(!token){setError('El enlace de recuperación no es válido o ya expiró.');return}
    setBusy(true);setError('');
    try{
      const {error}=await authClient.resetPassword({newPassword:password,token});
      if(error){setError(error.message||'No se pudo cambiar la contraseña. Solicita un enlace nuevo.');return}
      setDone(true);
    }catch{setError('No se pudo completar el cambio de contraseña.')}
    finally{setBusy(false)}
  }

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/ingresar" className="btn btn-secondary">Ingresar</Link></div>
    <div className="demo-head"><span className="eyebrow">Seguridad TURNAVIA</span><h1>Crea una contraseña nueva</h1><p className="muted">El enlace es de un solo uso y debe estar vigente.</p></div>
    <section className="profile-card">
      {done?<div style={{textAlign:'center',padding:'20px 4px'}}><CheckCircle2 size={42}/><h2>Contraseña actualizada</h2><p className="muted">Ya puedes ingresar con tu contraseña nueva.</p><Link href="/ingresar" className="btn btn-primary">Ingresar a TURNAVIA</Link></div>:
      <form className="form" onSubmit={submit}>
        {(invalid||!token)&&<div className="notice danger">Este enlace no es válido o expiró. Solicita uno nuevo.</div>}
        <div className="field"><label>Nueva contraseña</label><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></div>
        <div className="field"><label>Repite la contraseña</label><input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
        {error&&<div className="notice danger">{error}</div>}
        <button className="btn btn-primary" disabled={busy||!token}>{busy?'Guardando...':'Guardar nueva contraseña'}</button>
        <Link href="/olvidar-contrasena" className="btn btn-secondary">Solicitar otro enlace</Link>
      </form>}
    </section>
  </div></main>;
}

export default function RestablecerContrasena(){
  return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card">Cargando...</div></div></main>}><ResetContent/></Suspense>
}
