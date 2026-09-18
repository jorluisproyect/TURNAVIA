'use client';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from './actions';
import { Brand } from '@/components/Brand';

export default function Registro(){
  const sp=useSearchParams();
  const initialRole=sp.get('role')==='DOCTOR'?'DOCTOR':'PATIENT';
  const initialEmail=sp.get('email')||'';
  const [state,action,pending]=useActionState(registerUser,null);
  return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div><div className="demo-head"><span className="eyebrow">Cuenta segura</span><h1>Crea tu cuenta TURNAVIA</h1><p className="muted">Tú eliges tu contraseña. Nunca la enviamos por correo ni WhatsApp.</p></div><section className="profile-card"><form action={action} className="form">
    <div className="field"><label>Tipo de cuenta</label><select name="role" defaultValue={initialRole}><option value="DOCTOR">Médico / profesional</option><option value="PATIENT">Paciente</option></select></div>
    <div className="field"><label>Nombre completo</label><input name="name" required placeholder="Nombre y apellido"/></div>
    <div className="field"><label>Correo</label><input name="email" type="email" required defaultValue={initialEmail} placeholder="correo@ejemplo.com"/></div>
    <div className="field"><label>Teléfono</label><input name="phone" placeholder="Opcional"/></div>
    <div className="field"><label>Contraseña</label><input name="password" type="password" minLength={8} required placeholder="Mínimo 8 caracteres"/></div>
    {state?.error&&<div className="notice danger">{state.error}</div>}
    <button className="btn btn-primary" disabled={pending}>{pending?'Creando cuenta...':'Crear mi cuenta'}</button>
    <div className="muted" style={{fontSize:13}}>Al crear tu cuenta aceptas el uso de TURNAVIA para gestionar reservas y notificaciones relacionadas con tus citas.</div>
  </form></section></div></main>
}
