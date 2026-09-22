'use client';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from './actions';
import { Brand } from '@/components/Brand';
import { Eye, EyeOff } from 'lucide-react';
import { PASSWORD_HELP } from '@/lib/password-policy';
import { PROVIDER_CATEGORIES, COUNTRY_SUGGESTIONS } from '@/lib/provider-catalog';

const categories=PROVIDER_CATEGORIES;

export default function RegistroClient(){
  const sp=useSearchParams();
  const initialRole=sp.get('role')==='PATIENT'?'PATIENT':'PROFESSIONAL';
  const requestedType=sp.get('type');
  const initial=requestedType==='BUSINESS'?'BUSINESS':requestedType==='PROFESSIONAL'?'PROFESSIONAL':initialRole;
  const [accountType,setAccountType]=useState(initial);
  const [category,setCategory]=useState('Salud');
  const [activity,setActivity]=useState('Médico');
  const initialEmail=sp.get('email')||'';
  const [state,action,pending]=useActionState(registerUser,null);
  const [showPassword,setShowPassword]=useState(false);
  const provider=accountType!=='PATIENT';

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div>
    <div className="demo-head"><span className="eyebrow">Cuenta segura</span><h1>Crea tu cuenta TUCITA</h1><p className="muted">El nombre que escribas será el nombre real que verá tu panel. Podrás modificarlo desde tu perfil.</p></div>
    <section className="profile-card"><form action={action} className="form">
      <div className="field"><label>Tipo de cuenta</label><select name="accountType" value={accountType} onChange={e=>setAccountType(e.target.value)}>
        <option value="PROFESSIONAL">Profesional independiente</option>
        <option value="BUSINESS">Negocio / local</option>
        <option value="PATIENT">Cliente / paciente</option>
      </select></div>
      <input type="hidden" name="role" value={provider?'DOCTOR':'PATIENT'}/>
      <input type="hidden" name="buyIntent" value={sp.get('buy')==='1'?'1':'0'}/>
      {provider&&<div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Rubro</label><select name="category" value={category} onChange={e=>{const v=e.target.value;setCategory(v);setActivity(categories[v][0])}}>{Object.keys(categories).map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Actividad</label><select name="activity" value={activity} onChange={e=>setActivity(e.target.value)}>{categories[category].map(a=><option key={a}>{a}</option>)}</select></div>
      </div>}
      {category==='Servicios 18+'&&provider&&<div className="notice">Categoría reservada para mayores de edad y actividades permitidas por la legislación aplicable.</div>}
      {provider&&<div className="field"><label>País donde prestas el servicio</label><input name="country" list="tucita-countries" required placeholder="Ej. Venezuela"/><datalist id="tucita-countries">{COUNTRY_SUGGESTIONS.map(x=><option key={x} value={x}/>)}</datalist><div className="muted" style={{fontSize:12,marginTop:6}}>Este dato ayuda a tus clientes a identificar dónde atiendes y aparecerá en tu perfil público.</div></div>}
      <div className="field"><label>{provider?'Nombre profesional o del negocio':'Nombre completo'}</label><input name="name" required placeholder={provider?'Ej. Ana Pérez / Barbería Central':'Nombre y apellido'}/></div>
      <div className="field"><label>Correo</label><input name="email" type="email" required defaultValue={initialEmail} placeholder="correo@ejemplo.com"/></div>
      <div className="field"><label>Teléfono / WhatsApp</label><input name="phone" required placeholder="Número de contacto"/></div>
      <div className="field"><label>Contraseña</label><div style={{position:'relative'}}><input name="password" type={showPassword?'text':'password'} minLength={8} required placeholder="Crea una contraseña segura" style={{paddingRight:46}}/><button type="button" aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><div className="muted" style={{fontSize:12,marginTop:6}}>{PASSWORD_HELP}</div></div>
      {state?.error&&<div className="notice danger">{state.error}</div>}
      <button className="btn btn-primary" disabled={pending}>{pending?'Creando cuenta...':'Crear mi cuenta'}</button>
      <div className="muted" style={{fontSize:13}}>TUCITA usa tus datos únicamente para gestionar tu cuenta, reservas y notificaciones del servicio.</div>
    </form></section>
  </div></main>
}
