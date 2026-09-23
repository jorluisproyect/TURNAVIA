'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

function AcceptInvitation(){
  const params=useSearchParams(),router=useRouter();
  const invite=params.get('invite')||'',email=params.get('email')||'';
  const [details,setDetails]=useState<{email:string;name:string;roleLabel:string}|null>(null);
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{
    if(!invite||!email){setMessage('Falta el enlace completo de invitación.');return}
    fetch('/api/master/team/accept?invite='+encodeURIComponent(invite)+'&email='+encodeURIComponent(email))
      .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Invitación no disponible.');return j})
      .then(setDetails).catch(e=>setMessage(e.message));
  },[invite,email]);
  async function accept(){
    setBusy(true);setMessage('');
    try{
      const r=await fetch('/api/master/team/accept',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invite})});
      const j=await r.json();
      if(!r.ok){setMessage(j.error||'No se pudo aceptar.');return}
      router.replace('/master');router.refresh();
    }catch{setMessage('No se pudo conectar con TUCITA. Intenta de nuevo.')}
    finally{setBusy(false)}
  }
  const path='/equipo/aceptar?invite='+encodeURIComponent(invite)+'&email='+encodeURIComponent(email);
  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/" className="btn btn-secondary">Inicio</Link></div>
    <section className="profile-card" style={{marginTop:32}}>
      <span className="eyebrow"><ShieldCheck size={15}/> EQUIPO INTERNO TUCITA</span>
      <h1 style={{margin:'14px 0 6px',fontSize:32}}>Tu invitación de trabajo</h1>
      {details?<><p className="muted">Hola {details.name}. Te invitaron como <strong>{details.roleLabel}</strong> usando el correo <strong>{details.email}</strong>.</p>
        <div className="notice" style={{margin:'16px 0'}}>Este acceso es un <strong>Master colaborador</strong>. No permite ver datos de clientes, aprobar pagos ni administrar otros usuarios.</div>
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={accept} disabled={busy}><CheckCircle2 size={17}/>{busy?'Comprobando...':'Ya tengo cuenta: aceptar'}</button>
          <Link className="btn btn-secondary" href={'/registro?team=1&invite='+encodeURIComponent(invite)+'&email='+encodeURIComponent(email)}>Crear mi cuenta de equipo</Link>
        </div>
        <div style={{marginTop:12}}><Link href={'/ingresar?next='+encodeURIComponent(path)} className="muted" style={{fontSize:13}}>¿No has iniciado sesión? Ingresa primero y vuelve aquí.</Link></div>
      </>:<div className="notice" style={{marginTop:16}}>{message||'Verificando invitación...'}</div>}
      {details&&message&&<div className="notice danger" style={{marginTop:12}}>{message}</div>}
    </section>
  </div></main>;
}
export default function AcceptPage(){
  return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap">Cargando invitación…</div></main>}><AcceptInvitation/></Suspense>;
}
