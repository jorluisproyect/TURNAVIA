'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { Eye, EyeOff } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export default function Ingresar(){
  const [showPassword,setShowPassword]=useState(false);
  const [next,setNext]=useState('');
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{setNext(new URLSearchParams(window.location.search).get('next')||'')},[]);

  async function handleSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(pending) return;

    const form=new FormData(event.currentTarget);
    const email=String(form.get('email')||'').trim().toLowerCase();
    const password=String(form.get('password')||'');

    setError('');
    setPending(true);

    try{
      const result=await authClient.signIn.email({email,password});
      if(result.error){
        setError(result.error.message||'Correo o contraseña incorrectos.');
        return;
      }

      const safeNext=next.startsWith('/equipo/aceptar?invite=') && next.length<500 && !/[\r\n]/.test(next)
        ? next
        : '/panel';

      // Full navigation guarantees that the newly-created auth cookie is
      // visible to the first server-rendered page behind cPanel/Apache.
      window.location.assign(safeNext);
    }catch(err){
      console.error('TUCITA login error',err);
      setError('No se pudo iniciar sesión. Intenta nuevamente.');
    }finally{
      setPending(false);
    }
  }

  return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link className="btn btn-secondary" href="/">Inicio</Link></div><div className="demo-head"><span className="eyebrow">Acceso seguro</span><h1>Ingresa a TUCITA</h1><p className="muted">Profesionales, negocios y clientes usan el correo y la contraseña que ellos mismos crearon.</p></div><section className="profile-card"><form onSubmit={handleSubmit} className="form">
    <div className="field"><label>Correo / usuario</label><input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="correo@ejemplo.com"/><small className="muted">Tu correo es tu usuario de acceso a TUCITA.</small></div>
    <div className="field"><div className="row space"><label>Contraseña</label><Link href="/olvidar-contrasena" style={{fontSize:13}}>¿La olvidaste?</Link></div><div style={{position:'relative'}}><input name="password" type={showPassword?'text':'password'} required autoComplete="current-password" style={{paddingRight:46}}/><button type="button" aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
    {error&&<div className="notice danger">{error}</div>}
    <button className="btn btn-primary" type="submit" disabled={pending} aria-busy={pending}>{pending?'Ingresando...':'Ingresar'}</button>
    <div className="button-row"><Link href="/registro" className="btn btn-secondary">Crear cuenta TUCITA</Link></div>
  </form></section></div></main>
}
