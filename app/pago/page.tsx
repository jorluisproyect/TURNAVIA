'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { CreditCard, Bitcoin, ShieldCheck, Upload } from 'lucide-react';

function PagoContent(){
  const sp=useSearchParams();
  const id=sp.get('client')||'';
  const [c,setC]=useState<any>(null);
  const [ref,setRef]=useState('');
  const [proof,setProof]=useState<File|null>(null);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');
  useEffect(()=>{if(id)fetch('/api/clients?id='+encodeURIComponent(id)).then(r=>r.json()).then(j=>setC(j.client))},[id]);
  const clinic=String(c?.type||'').startsWith('Negocio')||String(c?.type||'').startsWith('Clínica');
  const initial=clinic?149:40;
  const monthly=clinic?49:15;
  const isRenewal=Boolean(c?.paymentReviewedAt);
  const amountDue=isRenewal?monthly:initial;
  const underReview=c?.status==='REVISION_BINANCE';
  const paypalUser='jorgeluisananguren@gmail.com';
  const binanceUid='182547235';

  async function sendManual(method:'PAYPAL'|'BINANCE'){
    if(underReview) return setMsg('Ya tienes un pago en revisión. Espera la validación del Master.');
    if(!ref.trim()) return setMsg('Escribe la referencia o ID de la transacción.');
    if(!proof) return setMsg('Adjunta el capture o comprobante del pago.');
    if(proof.size>5*1024*1024) return setMsg('El comprobante debe pesar máximo 5 MB.');
    if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(proof.type)) return setMsg('Usa JPG, PNG, WEBP o PDF.');
    setBusy(method.toLowerCase()); setMsg('');
    const form=new FormData();
    form.append('clientId',id); form.append('reference',ref.trim()); form.append('paymentMethod',method);
    form.append('comment',`TURNAVIA - ${c.name}`); form.append('proof',proof);
    const r=await fetch('/api/payments/binance',{method:'POST',body:form});
    const j=await r.json(); setBusy('');
    if(j.ok){setMsg('Pago enviado a revisión. El Master verificará la referencia y el comprobante antes de activar la cuenta.');setC(j.client)}
    else setMsg(j.error||'No se pudo enviar el pago.');
  }

  if(!id)return <main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card" style={{marginTop:30}}>Falta identificar la cuenta. Vuelve a Activar TURNAVIA.</div></div></main>;
  const methodCard=(method:'PAYPAL'|'BINANCE')=><div className="card">
    <div className="iconbox">{method==='PAYPAL'?<CreditCard/>:<Bitcoin/>}</div>
    <h3>{method==='PAYPAL'?'PayPal':'Binance'}</h3>
    <p>Realiza el pago manualmente y luego registra la referencia real junto con el comprobante.</p>
    <div className="notice" style={{marginTop:14}}>
      <strong>{method==='PAYPAL'?'Cuenta PayPal TURNAVIA':'Binance TURNAVIA'}</strong><br/>
      {method==='PAYPAL'?<>Correo: <strong>{paypalUser}</strong></>:<>UID: <strong>{binanceUid}</strong></>}<br/><br/>
      Concepto sugerido:<br/><strong>TURNAVIA - {c.name}</strong>
    </div>
    <div className="field" style={{marginTop:12}}><label>Referencia / ID de transacción</label><input value={ref} onChange={e=>setRef(e.target.value)} placeholder={method==='PAYPAL'?'Ej. ID de PayPal':'Ej. 873921...'}/></div>
    <div className="field" style={{marginTop:12}}><label>Capture / comprobante</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setProof(e.target.files?.[0]||null)}/><div className="muted" style={{fontSize:12,marginTop:6}}>JPG, PNG, WEBP o PDF · máximo 5 MB.</div></div>
    <button className={method==='PAYPAL'?'btn btn-primary':'btn btn-secondary'} style={{marginTop:12,width:'100%'}} onClick={()=>sendManual(method)} disabled={!!busy||underReview}><Upload size={16}/>{underReview?' Pago en revisión':busy===method.toLowerCase()?' Enviando...':` Enviar ${method} a revisión`}</button>
  </div>;

  return <main className="demo-chooser"><div className="container booking-wrap"><div className="row space"><Brand/><Link href="/" className="btn btn-secondary">Inicio</Link></div><div className="demo-head"><span className="eyebrow"><ShieldCheck size={15}/> Pago seguro</span><h1>Continúa con TURNAVIA</h1><p className="muted">{c?<>Cuenta: <strong>{c.name}</strong></>:'Cargando cuenta...'}</p></div>{c&&<><section className="profile-card"><h2>{isRenewal?'Renovación mensual':'Activación inicial'}</h2>{isRenewal?<div className="stat-grid" style={{gridTemplateColumns:'1fr 1fr'}}><div className="stat"><small>Renovación</small><div className="n">${monthly}</div></div><div className="stat"><small>Total hoy</small><div className="n">${amountDue}</div></div></div>:<div className="stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}><div className="stat"><small>Activación</small><div className="n">${clinic?100:25}</div></div><div className="stat"><small>Primer mes</small><div className="n">${monthly}</div></div><div className="stat"><small>Total hoy</small><div className="n">${initial}</div></div></div>}<p className="muted">{isRenewal?<>Esta renovación mantiene tu cuenta activa por el siguiente ciclo mensual.</>:<>Después de este pago, la renovación es de <strong>${monthly}/mes</strong>.</>}</p>{underReview&&<div className="notice"><strong>Pago en revisión.</strong><br/>Ya recibimos tu referencia y comprobante. No necesitas enviarlo nuevamente.</div>}{c.paymentRejectionReason&&c.status==='PAGO_PENDIENTE'&&<div className="notice danger"><strong>Pago rechazado:</strong> {c.paymentRejectionReason}</div>}</section><div style={{height:16}}/><section className="grid-3" style={{gridTemplateColumns:'1fr 1fr'}}>{methodCard('PAYPAL')}{methodCard('BINANCE')}</section>{msg&&<div className="notice" style={{marginTop:18}}>{msg}</div>}<div className="notice" style={{marginTop:18}}>Estado actual: <strong>{c.status}</strong>. TURNAVIA no activa la cuenta hasta que el Master verifique el pago.</div></>}</div></main>;
}
export default function Pago(){return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card">Cargando pago...</div></div></main>}><PagoContent/></Suspense>}
