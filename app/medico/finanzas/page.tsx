'use client';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, DollarSign, TrendingUp, WalletCards } from 'lucide-react';

const statusLabel:any={PAYMENT_REVIEW:'En revisión',PAYMENT_REJECTED:'Pago rechazado',CONFIRMED:'Confirmada',ON_THE_WAY:'En camino',ARRIVED:'Llegó',IN_CONSULTATION:'En atención',COMPLETED:'Completada',CANCELLED:'Cancelada',NO_SHOW:'No asistió'};

function usd(v:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(v||0))}
function original(amount:number,currency:string){return new Intl.NumberFormat('es-VE',{minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(amount||0))+' '+currency}

export default function FinanzasProfesional(){
 const [data,setData]=useState<any>(null);
 const [error,setError]=useState('');
 const [weeks,setWeeks]=useState(8);
 const [hover,setHover]=useState<number|null>(null);

 useEffect(()=>{fetch('/api/me/provider/finance').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{if(!ok)throw new Error(j.error||'No se pudo cargar');setData(j)}).catch(e=>setError(e.message))},[]);
 const chart=useMemo(()=>data?.weekly?.slice(-weeks)||[],[data,weeks]);
 const max=useMemo(()=>Math.max(1,...chart.map((x:any)=>Number(x.amountUsd||0))),[chart]);

 if(error)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><div className="notice danger">{error}</div></main></div>;
 if(!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main">Cargando finanzas…</main></div>;

 const s=data.summary||{};
 const fx=data.fx||{};
 const ves=Number(fx.rates?.VES||0),eur=Number(fx.rates?.EUR||0);
 const selected=hover!==null?chart[hover]:null;

 return <div className="dashboard"><Sidebar role="medico"/><main className="main">
  <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Panel profesional</div><h1>Finanzas</h1><p className="muted" style={{margin:'6px 0 0'}}>Una vista clara de lo cobrado, lo programado y el movimiento de tus reservas.</p></div><span className="eyebrow"><TrendingUp size={15}/> Resumen inteligente</span></div>

  <div className="stat-grid">
   <div className="stat finance-stat"><div className="row space"><small>Cobrado esta semana</small><CheckCircle2 size={18}/></div><div className="n">{usd(s.weekPaidUsd)}</div><div className="muted" style={{fontSize:12}}>Pagos aprobados o servicios completados esta semana</div></div>
   <div className="stat finance-stat"><div className="row space"><small>Ingresos programados</small><CalendarClock size={18}/></div><div className="n">{usd(s.scheduledUsd)}</div><div className="muted" style={{fontSize:12}}>Valor estimado de próximas reservas activas</div></div>
   <div className="stat finance-stat"><div className="row space"><small>Total cobrado registrado</small><WalletCards size={18}/></div><div className="n">{usd(s.paidUsd)}</div><div className="muted" style={{fontSize:12}}>Historial disponible en TUCITA</div></div>
   <div className="stat finance-stat"><div className="row space"><small>Por revisar</small><Clock3 size={18}/></div><div className="n">{usd(s.reviewUsd)}</div><div className="muted" style={{fontSize:12}}>Reservas con comprobante pendiente</div></div>
  </div>

  <section className="panel finance-hero">
   <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><span className="eyebrow"><TrendingUp size={14}/> Tendencia</span><h2 style={{fontSize:24,margin:'10px 0 4px'}}>Ganancias por semana</h2><div className="muted">Pasa el cursor por cada barra para ver el detalle.</div></div><div className="row" style={{gap:6}}>{[4,8].map(n=><button key={n} className={'btn '+(weeks===n?'btn-primary':'btn-secondary')} onClick={()=>setWeeks(n)}>{n} sem.</button>)}</div></div>
   <div className="finance-chart" style={{marginTop:24}}>
     {chart.map((x:any,i:number)=><button key={x.start} className={'finance-bar-wrap '+(hover===i?'active':'')} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(i)} onBlur={()=>setHover(null)} aria-label={x.label+' '+usd(x.amountUsd)}>
       <div className="finance-bar-value">{hover===i?usd(x.amountUsd):''}</div>
       <div className="finance-bar" style={{height:Math.max(8,(Number(x.amountUsd||0)/max)*170)}}/>
       <small>{x.label}</small>
     </button>)}
   </div>
   <div className="finance-chart-note">{selected?<><strong>{selected.label}</strong> · {usd(selected.amountUsd)} · {selected.appointments} cita{selected.appointments===1?'':'s'} cobrada{selected.appointments===1?'':'s'}</>:<>La gráfica utiliza el valor equivalente en USD para comparar cobros en distintas monedas.</>}</div>
  </section>

  {fx.available&&<section className="panel" style={{marginTop:18}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Conversión automática</h2><div className="muted" style={{fontSize:13}}>Referencia actual para comparar precios en USD, EUR, USDT y VES.</div></div><DollarSign size={20}/></div>
    <div className="grid-3" style={{marginTop:12}}>
      <div className="card"><small className="muted">1 USD</small><div className="n" style={{fontSize:24,marginTop:7}}>{eur?eur.toFixed(4):'—'} EUR</div></div>
      <div className="card"><small className="muted">1 USD</small><div className="n" style={{fontSize:24,marginTop:7}}>1.00 USDT</div></div>
      <div className="card"><small className="muted">1 USD</small><div className="n" style={{fontSize:24,marginTop:7}}>{ves?new Intl.NumberFormat('es-VE',{maximumFractionDigits:2}).format(ves):'—'} VES</div></div>
    </div>
    <div className="muted" style={{fontSize:11,marginTop:10}}>Tipo de cambio de referencia actualizado automáticamente. USDT se muestra con equivalencia operativa 1 USDT ≈ 1 USD. <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>Rates by Exchange Rate API</a>.</div>
  </section>}

  <section className="panel" style={{marginTop:18}}>
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Próximas ganancias programadas</h2><div className="muted" style={{fontSize:13}}>Reservas futuras activas, confirmadas o en revisión.</div></div><ArrowUpRight size={20}/></div>
    {!data.upcoming?.length?<div className="empty">Todavía no hay reservas futuras.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Estado</th><th>Precio</th><th>≈ USD</th></tr></thead><tbody>{data.upcoming.map((x:any)=><tr key={x.id}><td>{new Date(x.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short'})}</td><td>{x.clientName}</td><td>{x.serviceName}</td><td><span className="pill">{statusLabel[x.status]||x.status}</span></td><td><strong>{original(x.amount,x.currency)}</strong></td><td>{usd(x.usd)}</td></tr>)}</tbody></table></div>}
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Historial de ingresos y reservas</h2>
    {!data.history?.length?<div className="empty">Todavía no hay movimientos.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Pago</th><th>Estado</th><th>Monto</th><th>≈ USD</th></tr></thead><tbody>{data.history.map((x:any)=><tr key={x.id}><td>{new Date(x.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short'})}</td><td>{x.clientName}</td><td>{x.serviceName}</td><td>{x.paid?<span className="status ok">Pagado</span>:x.status==='PAYMENT_REVIEW'?<span className="status warn">Por revisar</span>:<span className="status">Programado</span>}</td><td>{statusLabel[x.status]||x.status}</td><td><strong>{original(x.amount,x.currency)}</strong></td><td>{usd(x.usd)}</td></tr>)}</tbody></table></div>}
  </section>
 </main></div>
}
