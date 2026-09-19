'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { signInUser } from './actions';

export default function Ingresar(){
  const [state,action,pending]=useActionState(signInUser,null);
  return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link className="btn btn-secondary" href="/">Inicio</Link></div><div className="demo-head"><span className="eyebrow">Acceso seguro</span><h1>Ingresa a TURNAVIA</h1><p className="muted">Profesionales, negocios y clientes usan el correo y la contraseña que ellos mismos crearon.</p></div><section className="profile-card"><form action={action} className="form">
    <div className="field"><label>Correo</label><input name="email" type="email" required placeholder="correo@ejemplo.com"/></div>
    <div className="field"><label>Contraseña</label><input name="password" type="password" required/></div>
    {state?.error&&<div className="notice danger">{state.error}</div>}
    <button className="btn btn-primary" disabled={pending}>{pending?'Ingresando...':'Ingresar'}</button>
    <div className="button-row"><Link href="/registro?role=DOCTOR" className="btn btn-secondary">Crear cuenta profesional</Link><Link href="/registro?role=PATIENT" className="btn btn-secondary">Crear cuenta cliente</Link></div>
  </form></section></div></main>
}
