'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { billingQuote, type BillingMonths, type PlanKey } from '@/lib/plans';

const features:Record<PlanKey,string[]>={
  PROFESSIONAL:['Agenda y disponibilidad','Servicios, duración y precios','Reservas, pagos y comprobantes','Tu enlace para compartir con clientes'],
  BUSINESS:['Hasta 5 profesionales','Servicios y agendas por profesional','Página pública del negocio','Reservas, pagos y comprobantes'],
};
function PriceCard({type}:{type:PlanKey}){
  const [months,setMonths]=useState<BillingMonths>(1);
  const quote=billingQuote(type==='BUSINESS'?'Negocio / local':'Profesional independiente',months,false);
  const plan=quote.plan;
  const purchase='/registro?role=DOCTOR&type='+type+'&buy=1&months='+months;
  return <section className="panel">
    <span className="eyebrow">{type==='BUSINESS'?'NEGOCIO / LOCAL':'PROFESIONAL INDEPENDIENTE'}</span>
    <div role="group" aria-label={'Duración del plan '+plan.label} className="button-row" style={{margin:'15px 0 12px',gap:7}}>
      {([1,3,12] as BillingMonths[]).map(m=><button key={m} type="button" className={'btn '+(months===m?'btn-primary':'btn-secondary')} aria-pressed={months===m} style={{flex:1,padding:'10px 8px'}} onClick={()=>setMonths(m)}>{m===1?'1 mes':m===3?'3 meses':'1 año'}</button>)}
    </div>
    {type==='PROFESSIONAL'&&months===12&&<span className="pill"><Sparkles size={15}/> PROMO ANUAL · AHORRAS $55</span>}
    <h2 style={{fontSize:35,margin:'12px 0 4px'}}>${quote.total} <span className="muted" style={{fontSize:14,fontWeight:500}}>USD · pago inicial</span></h2>
    <p className="muted" style={{marginBottom:10}}>{months===12?'12 meses':months===3?'3 meses':'1 mes'} de servicio: <strong>${quote.planAmount}</strong>{quote.activation?<> · Activación única: <strong>${quote.activation}</strong></>:' · Activación incluida'}</p>
    {type==='PROFESSIONAL'&&months===12&&<div className="notice"><strong>Año completo por $125.</strong> En esta promoción, la activación de $25 está incluida. Luego renuevas por $125/año.</div>}
    {type==='BUSINESS'&&months===12&&<div className="notice">Plan anual de negocio: 12 × $49 = $588 de servicio. La activación única de $100 se cobra solo al comenzar.</div>}
    <div style={{display:'grid',gap:8,margin:'14px 0'}}>
      {features[type].map(x=><div className="notice" key={x}><CheckCircle2 size={16}/> {x}</div>)}
      <div className="notice"><CheckCircle2 size={16}/> 15 días de prueba sin tarjeta</div>
    </div>
    <div className="button-row">
      <Link href={'/registro?role=DOCTOR&type='+type} className="btn btn-secondary">Probar 15 días</Link>
      <Link href={purchase} className="btn btn-primary"><CreditCard size={16}/> Elegir plan</Link>
    </div>
  </section>;
}
export default function BillingPlans(){
  return <div id="planes" className="panel-grid" style={{marginTop:18,scrollMarginTop:24}}>
    <PriceCard type="PROFESSIONAL"/>
    <PriceCard type="BUSINESS"/>
  </div>;
}
