'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { Bitcoin, CheckCircle2, CreditCard, ShieldCheck, Upload, WalletCards } from 'lucide-react';

type PaymentMethod={
  id:string;
  name:string;
  type:string;
  account_label?:string;
  account_value?:string;
  instructions?:string;
  currency?:string;
  requires_proof?:boolean;
  active?:boolean;
};

function PagoContent(){
  const sp=useSearchParams();
  const id=sp.get('client')||'';
  const [c,setC]=useState<any>(null);
  const [methods,setMethods]=useState<PaymentMethod[]>([]);
  const [selectedId,setSelectedId]=useState('');
  const [reference,setReference]=useState('');
  const [proof,setProof]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  const [success,setSuccess]=useState(false);
  const [loadError,setLoadError]=useState('');

  useEffect(()=>{
    if(!id)return;
    Promise.all([
      fetch('/api/clients?id='+encodeURIComponent(id)).then(async r=>({ok:r.ok,j:await r.json()})),
      fetch('/api/payment-methods?scope=MASTER&active=1').then(async r=>({ok:r.ok,j:await r.json()}))
    ]).then(([clientRes,methodRes])=>{
      if(!clientRes.ok){setLoadError(clientRes.j?.error||'No se pudo cargar tu cuenta.');return}
      setC(clientRes.j.client);
      if(methodRes.ok){
        const list=methodRes.j.methods||[];
        setMethods(list);
        setSelectedId(list[0]?.id||'');
      }else setLoadError(methodRes.j?.error||'No se pudieron cargar los métodos de pago.');
    }).catch(()=>setLoadError('No se pudo conectar con TURNAVIA.'));
  },[id]);

  const selected=useMemo(()=>methods.find(m=>m.id===selectedId)||null,[methods,selectedId]);
  const clinic=String(c?.type||'').startsWith('Negocio')||String(c?.type||'').startsWith('Clínica');
  const initial=clinic?149:40;
  const monthly=clinic?49:15;
  const isRenewal=Boolean(c?.paymentReviewedAt);
  const amountDue=isRenewal?monthly:initial;
  const underReview=c?.status==='REVISION_BINANCE'||success;

  function iconFor(method:PaymentMethod){
    const type=String(method.type||'').toUpperCase();
    return type==='BINANCE'?Bitcoin:type==='PAYPAL'?CreditCard:WalletCards;
  }

  async function sendManual(){
    if(underReview)return setMsg('Tu pago ya fue enviado y está esperando aprobación del Master.');
    if(!selected)return setMsg('Selecciona un método de pago.');
    if(!reference.trim())return setMsg('Escribe la referencia o ID de la transacción.');
    if(selected.requires_proof!==false&&!proof)return setMsg('Adjunta el capture o comprobante del pago.');
    if(proof&&proof.size>5*1024*1024)return setMsg('El comprobante debe pesar máximo 5 MB.');
    if(proof&&!['image/jpeg','image/png','image/webp','application/pdf'].includes(proof.type))return setMsg('Usa JPG, PNG, WEBP o PDF.');

    setBusy(true);
    setMsg('');
    try{
      const form=new FormData();
      form.append('clientId',id);
      form.append('reference',reference.trim());
      form.append('paymentMethod',selected.type||selected.name);
      form.append('paymentMethodId',selected.id);
      form.append('comment',`TURNAVIA - ${c.name}`);
      if(proof)form.append('proof',proof);

      const r=await fetch('/api/payments/binance',{method:'POST',body:form});
      const raw=await r.text();
      let j:any={};
      try{j=raw?JSON.parse(raw):{}}catch{j={error:'El servidor respondió de forma inesperada. Intenta nuevamente.'}}
      if(!r.ok||!j.ok){
        setMsg(j.error||'No se pudo enviar el pago.');
        return;
      }

      setC((prev:any)=>({...prev,...j.client,status:'REVISION_BINANCE'}));
      setSuccess(true);
      setMsg('');
      setProof(null);
    }catch{
      setMsg('No se pudo completar el envío. Verifica tu conexión e intenta nuevamente.');
    }finally{
      setBusy(false);
    }
  }

  if(!id)return <main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card" style={{marginTop:30}}>Falta identificar la cuenta. Vuelve a la página de venta y crea tu cuenta.</div></div></main>;

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link href="/" className="btn btn-secondary">Inicio</Link></div>
    <div className="demo-head"><span className="eyebrow"><ShieldCheck size={15}/> Activación TURNAVIA</span><h1>Realiza tu pago</h1><p className="muted">{c?<>Cuenta: <strong>{c.name}</strong></>:'Cargando cuenta...'}</p></div>

    {loadError&&<div className="notice danger">{loadError}</div>}

    {c&&<><section className="profile-card">
      <h2>{isRenewal?'Renovación mensual':'Activación inicial'}</h2>
      {isRenewal?
        <div className="stat-grid" style={{gridTemplateColumns:'1fr 1fr'}}><div className="stat"><small>Renovación</small><div className="n">${monthly}</div></div><div className="stat"><small>Total hoy</small><div className="n">${amountDue}</div></div></div>
        :<div className="stat-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}><div className="stat"><small>Activación</small><div className="n">${clinic?100:25}</div></div><div className="stat"><small>Primer mes</small><div className="n">${monthly}</div></div><div className="stat"><small>Total hoy</small><div className="n">${initial}</div></div></div>}
      <p className="muted">{isRenewal?<>Esta renovación mantiene tu cuenta activa por el siguiente ciclo mensual.</>:<>Después de este pago, la renovación es de <strong>${monthly}/mes</strong>.</>}</p>
    </section>

    <div style={{height:16}}/>

    {underReview?<section className="panel" style={{textAlign:'center'}}>
      <CheckCircle2 size={52} style={{margin:'0 auto 12px'}}/>
      <h2>Pago enviado correctamente</h2>
      <p className="muted" style={{maxWidth:620,margin:'0 auto'}}>Recibimos tu referencia y comprobante. Tu pago está <strong>esperando aprobación del administrador de TURNAVIA</strong>. No necesitas enviarlo nuevamente.</p>
      <div className="notice" style={{marginTop:18}}><strong>Estado: PAGO EN REVISIÓN</strong><br/>Cuando sea aprobado, tu cuenta quedará activa y recibirás la confirmación correspondiente.</div>
      <div className="button-row" style={{justifyContent:'center',marginTop:18}}><Link href="/panel" className="btn btn-primary">Ir a mi panel</Link><Link href="/" className="btn btn-secondary">Volver al inicio</Link></div>
    </section>:<>
      <section className="panel">
        <h2>1. Elige cómo pagar</h2>
        <p className="muted">Selecciona un solo método. La referencia y el comprobante pertenecen únicamente al método elegido.</p>
        {methods.length?<div className="grid-3" style={{gridTemplateColumns:methods.length===1?'1fr':'repeat(2,1fr)',marginTop:14}}>{methods.map(method=>{
          const Icon=iconFor(method);
          const chosen=method.id===selectedId;
          return <button type="button" key={method.id} onClick={()=>{setSelectedId(method.id);setReference('');setProof(null);setMsg('')}} className="card" style={{textAlign:'left',cursor:'pointer',borderColor:chosen?'var(--brand)':'var(--line)',boxShadow:chosen?'0 0 0 2px rgba(15,118,110,.12)':'none'}}>
            <div className="row space"><div className="iconbox"><Icon/></div>{chosen&&<span className="status ok">Seleccionado</span>}</div>
            <h3>{method.name}</h3>
            <p>{method.instructions||'Realiza el pago y registra la referencia para validación.'}</p>
            <div className="notice"><strong>{method.account_label||'Datos de pago'}</strong><br/><span style={{wordBreak:'break-word'}}>{method.account_value||'Configurar método'}</span></div>
          </button>
        })}</div>:!loadError&&<div className="notice danger">No hay métodos de pago activos en este momento. Contacta a TURNAVIA antes de realizar un pago.</div>}
      </section>

      {selected&&<section className="panel" style={{marginTop:18}}>
        <h2>2. Confirma tu pago por {selected.name}</h2>
        <div className="notice"><strong>Total a pagar: USD {amountDue}</strong><br/>Concepto sugerido: TURNAVIA - {c.name}</div>
        <div className="field" style={{marginTop:14}}><label>Referencia / ID de transacción</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder={String(selected.type).toUpperCase()==='BINANCE'?'ID / TxID de Binance':'Referencia real del pago'}/></div>
        {selected.requires_proof!==false&&<div className="field" style={{marginTop:12}}><label>Capture / comprobante</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setProof(e.target.files?.[0]||null)}/><div className="muted" style={{fontSize:12,marginTop:6}}>JPG, PNG, WEBP o PDF · máximo 5 MB.</div></div>}
        {msg&&<div className="notice danger" style={{marginTop:12}}>{msg}</div>}
        <button className="btn btn-primary" style={{marginTop:14,width:'100%'}} onClick={sendManual} disabled={busy}><Upload size={16}/>{busy?' Enviando pago...':' Enviar pago a revisión'}</button>
      </section>}
    </>}

    {c.paymentRejectionReason&&c.status==='PAGO_PENDIENTE'&&<div className="notice danger" style={{marginTop:18}}><strong>Pago rechazado:</strong> {c.paymentRejectionReason}</div>}
    </>}
  </div></main>;
}

export default function Pago(){
  return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card">Cargando pago...</div></div></main>}><PagoContent/></Suspense>
}
