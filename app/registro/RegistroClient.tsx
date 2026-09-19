'use client';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from './actions';
import { Brand } from '@/components/Brand';

const categories:Record<string,string[]>={
  'Salud':['Médico','Odontología','Psicología','Fisioterapia','Nutrición','Veterinaria','Otro'],
  'Belleza':['Barbería','Peluquería','Manicurista','Cejas y pestañas','Maquillaje','Estética','Otro'],
  'Bienestar':['Spa','Masajes','Yoga','Pilates','Coach personal','Otro'],
  'Servicios profesionales':['Abogado','Contador','Consultor','Asesor','Arquitecto','Diseñador','Otro'],
  'Educación':['Profesor particular','Academia','Idiomas','Música','Baile','Otro'],
  'Automotriz':['Taller','Detailing','Autolavado','Cambio de aceite','Accesorios','Otro'],
  'Hogar y técnicos':['Electricista','Plomero','Aire acondicionado','Computación','Celulares','Limpieza','Otro'],
  'Mascotas':['Grooming','Paseador','Pet sitting','Entrenamiento','Hotel para mascotas','Otro'],
  'Deporte':['Entrenador personal','Cancha','Academia deportiva','Otro'],
  'Espacios y alquiler':['Coworking','Sala de reuniones','Consultorio por hora','Estudio de grabación','Otro'],
  'Eventos':['Fotografía','Wedding planner','Salón de fiesta','Catering','Alquiler de vestidos','Otro'],
  'Servicios 18+':['Servicio privado con reserva','Otro'],
  'Otro':['Otro servicio con citas']
};

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
  const provider=accountType!=='PATIENT';

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div>
    <div className="demo-head"><span className="eyebrow">Cuenta segura</span><h1>Crea tu cuenta TURNAVIA</h1><p className="muted">El nombre que escribas será el nombre real que verá tu panel. Podrás modificarlo desde tu perfil.</p></div>
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
      <div className="field"><label>{provider?'Nombre profesional o del negocio':'Nombre completo'}</label><input name="name" required placeholder={provider?'Ej. Ana Pérez / Barbería Central':'Nombre y apellido'}/></div>
      <div className="field"><label>Correo</label><input name="email" type="email" required defaultValue={initialEmail} placeholder="correo@ejemplo.com"/></div>
      <div className="field"><label>Teléfono / WhatsApp</label><input name="phone" required placeholder="Número de contacto"/></div>
      <div className="field"><label>Contraseña</label><input name="password" type="password" minLength={8} required placeholder="Mínimo 8 caracteres"/></div>
      {state?.error&&<div className="notice danger">{state.error}</div>}
      <button className="btn btn-primary" disabled={pending}>{pending?'Creando cuenta...':'Crear mi cuenta'}</button>
      <div className="muted" style={{fontSize:13}}>TURNAVIA usa tus datos únicamente para gestionar tu cuenta, reservas y notificaciones del servicio.</div>
    </form></section>
  </div></main>
}
