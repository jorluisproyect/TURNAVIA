'use client';
import { useActionState, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerUser } from './actions';
import { Brand } from '@/components/Brand';
import { ArrowRight, Building2, Eye, EyeOff, Stethoscope, UserRound } from 'lucide-react';
import { PASSWORD_HELP } from '@/lib/password-policy';
import { PROVIDER_CATEGORIES, COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';
import { ADULT_CATEGORY, ADULT_COMPLIANCE_TEXT, PROVIDER_COMPLIANCE_TEXT } from '@/lib/compliance';
import { countryDialCode, countryPhoneInfo, digitsOnly, phoneAllowedLengths, phoneLengthHelp, phoneMaxLength, phoneMinLength } from '@/lib/phone';

const categories=PROVIDER_CATEGORIES;
type Availability={state:'checking'|'available'|'taken'|'error';message:string}|null;

export default function RegistroClient(){
  const sp=useSearchParams();
  const team=sp.get('team')==='1';
  const type=sp.get('type');
  const preset=team?'PATIENT':type==='BUSINESS'?'BUSINESS':sp.get('role')==='PATIENT'?'PATIENT':sp.get('role')==='DOCTOR'||type==='PROFESSIONAL'?'PROFESSIONAL':null;
  const accountType=preset||'PATIENT';
  const provider=!team&&accountType!=='PATIENT';
  const [category,setCategory]=useState('Salud');
  const [activity,setActivity]=useState('Médico');
  const [country,setCountry]=useState('Venezuela');
  const [phoneCountry,setPhoneCountry]=useState('Venezuela');
  const [phoneLocal,setPhoneLocal]=useState('');
  const [email,setEmail]=useState(sp.get('email')||'');
  const [availability,setAvailability]=useState<Availability>(null);
  const checkSeq=useRef(0);
  const [state,action,pending]=useActionState(registerUser,null);
  const [showPassword,setShowPassword]=useState(false);
  const [providerCompliance,setProviderCompliance]=useState(false);
  const [adultCompliance,setAdultCompliance]=useState(false);
  const phoneCode=countryDialCode(phoneCountry);
  const phoneInfo=countryPhoneInfo(phoneCountry);
  const phoneAllowed=phoneAllowedLengths(phoneCountry);
  const phoneMin=phoneMinLength(phoneCountry);
  const phoneMax=phoneMaxLength(phoneCountry);
  const phonePattern=phoneAllowed.length===1?`[0-9]{${phoneAllowed[0]}}`:`(?:${phoneAllowed.map(n=>`[0-9]{${n}}`).join('|')})`;

  async function checkEmail(){
    const requested=email.trim().toLowerCase();
    const seq=++checkSeq.current;
    if(!/^\S+@\S+\.\S+$/.test(requested)){setAvailability(null);return}
    setAvailability({state:'checking',message:'Verificando correo…'});
    try{
      const r=await fetch('/api/registro/check-email',{
        method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({email:requested})
      });
      const j=await r.json();
      if(seq!==checkSeq.current)return;
      if(!r.ok){setAvailability({state:'error',message:j.error||'No se pudo verificar el correo.'});return}
      setAvailability({state:j.available?'available':'taken',message:j.message});
    }catch{
      if(seq===checkSeq.current)setAvailability({state:'error',message:'No se pudo verificar el correo. Intenta de nuevo.'});
    }
  }

  if(!preset){
    return <main className="demo-chooser"><div className="container booking-wrap">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div>
      <section className="account-chooser" aria-label="Seleccionar tipo de cuenta">
        <span className="eyebrow">BIENVENIDO A TUCITA</span>
        <h1>¿Cómo utilizarás TUCITA?</h1>
        <p className="muted">Elige una opción. Te mostraremos únicamente los datos que necesitas para crear tu cuenta.</p>
        <div className="account-choice-grid">
          <Link className="account-choice-card" href="/registro?role=PATIENT">
            <span className="account-choice-icon"><UserRound size={26}/></span>
            <span className="account-choice-body"><strong>Cliente</strong><span>Quiero buscar servicios, reservar citas y consultar mis reservas.</span></span>
            <ArrowRight size={19} aria-hidden="true"/>
          </Link>
          <Link className="account-choice-card" href="/registro?role=DOCTOR&type=PROFESSIONAL">
            <span className="account-choice-icon"><Stethoscope size={26}/></span>
            <span className="account-choice-body"><strong>Profesional</strong><span>Presto servicios y quiero administrar mi agenda, horarios y clientes.</span></span>
            <ArrowRight size={19} aria-hidden="true"/>
          </Link>
          <Link className="account-choice-card account-choice-commercial" href="/registro?role=DOCTOR&type=BUSINESS">
            <span className="account-choice-icon"><Building2 size={26}/></span>
            <span className="account-choice-body"><strong>Comercial</strong><span>Soy dueño de un establecimiento y quiero gestionar servicios y equipo.</span></span>
            <ArrowRight size={19} aria-hidden="true"/>
          </Link>
        </div>
        <p className="muted" style={{fontSize:13,marginTop:18}}>Una cuenta por correo. Si ya tienes cuenta Cliente y quieres otra Profesional, usa un correo diferente.</p>
      </section>
    </div></main>;
  }

  const kind=team?'Equipo de TUCITA':accountType==='BUSINESS'?'Comercial':provider?'Profesional':'Cliente';
  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space" style={{gap:10,flexWrap:'wrap'}}><Brand/><Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link></div>
    <div className="demo-head">
      <span className="eyebrow">{team?'INVITACIÓN PRIVADA':'CREA TU CUENTA · '+kind.toUpperCase()}</span>
      <h1>{team?'Únete al equipo TUCITA':'Cuenta '+kind}</h1>
      <p className="muted">{team?'Regístrate con el correo invitado para entrar a tu espacio de trabajo.':accountType==='PATIENT'?'Como Cliente podrás reservar los servicios de los profesionales y consultar tus citas.':accountType==='BUSINESS'?'Como Comercial podrás gestionar tu establecimiento, profesionales y reservas.':'Como Profesional podrás ofrecer tus servicios y administrar tu propia agenda.'}</p>
      {!team&&<Link href="/registro" className="btn btn-secondary" style={{marginTop:12}}>Cambiar tipo de cuenta</Link>}
    </div>
    <section className="profile-card">
      <form action={action} className="form" onSubmit={e=>{if(availability?.state==='taken')e.preventDefault()}}>
        {team&&<input type="hidden" name="teamInvite" value={sp.get('invite')||''}/>}
        <input type="hidden" name="accountType" value={accountType}/>
        <input type="hidden" name="role" value={provider?'DOCTOR':'PATIENT'}/>
        <input type="hidden" name="buyIntent" value={sp.get('buy')==='1'?'1':'0'}/>
        <input type="hidden" name="months" value={sp.get('months')||'1'}/>
        {provider&&<div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
          <div className="field" style={{flex:1,minWidth:190}}><label>Rubro</label><select name="category" value={category} onChange={e=>{const next=e.target.value;setCategory(next);setActivity(categories[next][0])}}>{Object.keys(categories).map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="field" style={{flex:1,minWidth:190}}><label>Actividad</label><select name="activity" value={activity} onChange={e=>setActivity(e.target.value)}>{categories[category].map(a=><option key={a}>{a}</option>)}</select></div>
        </div>}
        {category===ADULT_CATEGORY&&provider&&<div className="notice"><strong>Solo +18 legal y no sexual.</strong><br/>Esta categoría no admite prostitución, escorts sexuales, citas remuneradas, actos sexuales pagados, pornografía, explotación, trata ni servicios con menores.</div>}
        {provider&&<div className="field">
          <label>País donde presta el servicio</label>
          <select name="country" value={country} onChange={e=>{const next=e.target.value;setCountry(next);setPhoneCountry(next);setPhoneLocal('')}} required>
            {COUNTRY_PHONE_CODES.map(x=><option key={x.country} value={x.country}>{x.flag} {x.country}</option>)}
          </select>
          <small className="muted">Selecciona el país donde atenderás a tus clientes.</small>
        </div>}
        <div className="field"><label>{provider?'Nombre profesional o del establecimiento':'Nombre completo'}</label><input name="name" required maxLength={120} placeholder={provider?'Ej. Ana Pérez / Barbería Central':'Nombre y apellido'}/></div>
        <div className="field">
          <label>Correo de acceso</label>
          <input name="email" type="email" required maxLength={254} autoComplete="email" value={email} readOnly={team} onChange={e=>{++checkSeq.current;setEmail(e.target.value);setAvailability(null)}} onBlur={checkEmail} placeholder="correo@ejemplo.com"/>
          <small className="muted"><strong>Este correo será tu usuario para ingresar a TUCITA.</strong> Escríbelo correctamente porque lo usarás cada vez que inicies sesión.</small>
          {availability&&<div className={'notice '+(availability.state==='taken'?'danger':'')} role="status" aria-live="polite" style={{marginTop:8,fontSize:13}}>{availability.message}</div>}
        </div>
        <div className="field">
          <label>Teléfono / WhatsApp</label>
          <div className="register-phone-row">
            <select name="phoneCountry" aria-label="País del teléfono" value={phoneCountry} onChange={e=>{setPhoneCountry(e.target.value);setPhoneLocal('')}}>
              {COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.country}>{x.flag} {x.country} ({x.code})</option>)}
            </select>
            <div className="register-phone-number">
              <span aria-label="Código internacional">{phoneCode}</span>
              <input
                name="phoneLocal"
                type="tel"
                inputMode="numeric"
                pattern={phonePattern}
                autoComplete="tel-national"
                minLength={phoneMin}
                maxLength={phoneMax}
                value={phoneLocal}
                onChange={e=>setPhoneLocal(digitsOnly(e.target.value,phoneMax))}
                placeholder={phoneInfo.placeholder}
                required
              />
            </div>
          </div>
          <small className="muted">
            {phoneInfo.flag} {phoneInfo.country}: {phoneLengthHelp(phoneCountry)} · código {phoneCode} automático · llevas {phoneLocal.length} dígito{phoneLocal.length===1?'':'s'}.
          </small>
        </div>
        <div className="field"><label>Contraseña</label><div style={{position:'relative'}}>
          <input name="password" type={showPassword?'text':'password'} minLength={8} required autoComplete="new-password" placeholder="Crea una contraseña segura" style={{paddingRight:46}}/>
          <button type="button" aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
        </div><small className="muted">{PASSWORD_HELP}</small></div>
        {team&&<div className="notice">Acceso de equipo por invitación, con permisos limitados a tu función.</div>}
        {provider&&<div className="notice">Tienes 15 días de prueba gratuita. El documento de identidad y la fecha de nacimiento se pueden completar después, desde tu perfil privado.</div>}
        {provider&&<>
          <label className="notice row" style={{alignItems:'flex-start',cursor:'pointer'}}><input type="checkbox" name="providerComplianceAccepted" value="1" checked={providerCompliance} onChange={e=>setProviderCompliance(e.target.checked)} required/><span><strong>Aceptación legal del proveedor.</strong><br/>{PROVIDER_COMPLIANCE_TEXT} <Link href="/legal/terminos">Términos</Link> · <Link href="/legal/privacidad">Privacidad</Link> · <Link href="/legal/servicios-prohibidos">Servicios prohibidos</Link>.</span></label>
          {category===ADULT_CATEGORY&&<label className="notice row" style={{alignItems:'flex-start',cursor:'pointer'}}><input type="checkbox" name="adultComplianceAccepted" value="1" checked={adultCompliance} onChange={e=>setAdultCompliance(e.target.checked)} required/><span><strong>Declaración adicional +18.</strong><br/>{ADULT_COMPLIANCE_TEXT}</span></label>}
        </>}
        {state?.error&&<div className="notice danger" role="alert">{state.error}</div>}
        <button className="btn btn-primary" disabled={pending||availability?.state==='taken'||(provider&&!providerCompliance)||(provider&&category===ADULT_CATEGORY&&!adultCompliance)} aria-busy={pending}>{pending?'Creando cuenta...':team?'Unirme al equipo':'Crear cuenta '+kind}</button>
        <div className="muted" style={{fontSize:13}}>Tus datos personales se utilizan para tu cuenta y sus operaciones, no se publican en tu página de reservas.</div>
      </form>
    </section>
  </div></main>;
}
