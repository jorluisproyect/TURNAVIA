'use client';
import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { signInUser } from './actions';
import { Eye, EyeOff } from 'lucide-react';

export default function Ingresar(){
  const [state,action,pending]=useActionState(signInUser,null);
  const [showPassword,setShowPassword]=useState(false);
  const [next,setNext]=useState('');
  useEffect(()=>{setNext(new URLSearchParams(window.location.search).get('next')||'')},[]);
  return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link className="btn btn-secondary" href="/">Inicio</Link></div><div className="demo-head"><span className="eyebrow">Acceso seguro</span><h1>Ingresa a TUCITA</h1><p className="muted">Profesionales, negocios y clientes usan el correo y la contraseña que ellos mismos crearon.</p></div><section className="profile-card"><form action={action} className="form"><input type="hidden" name="next" value={next}/>
    <div className="field"><label>Correo</label><input name="email" type="email" required placeholder="correo@ejemplo.com"/></div>
    <div className="field"><div className="row space"><label>Contraseña</label><Link href="/olvidar-contrasena" style={{fontSize:13}}>¿La olvidaste?</Link></div><div style={{position:'relative'}}><input name="password" type={showPassword?'text':'password'} required style={{paddingRight:46}}/><button type="button" aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
    {state?.error&&<div className="notice danger">{state.error}</div>}
    <button className="btn btn-primary" disabled={pending}>{pending?'Ingresando...':'Ingresar'}</button>
    <div className="button-row"><Link href="/registro" className="btn btn-secondary">Crear cuenta TUCITA</Link></div>
  </form></section></div></main>
}
