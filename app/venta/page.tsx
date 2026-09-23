import Link from 'next/link';
import { Brand } from '@/components/Brand';
import BillingPlans from '@/components/BillingPlans';
import { ArrowDown, ArrowRight, CheckCircle2, CreditCard, Eye, ShieldCheck, Sparkles } from 'lucide-react';

export const dynamic='force-static';

export default function Venta(){
  return <main className="demo-chooser"><div className="container">
    <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
      <Brand/>
      <div className="button-row">
        <Link href="/demo" className="btn btn-secondary"><Eye size={16}/> Ver demostración</Link>
        <Link href="/ingresar" className="btn btn-secondary">Ya tengo cuenta</Link>
      </div>
    </div>

    <div className="demo-head" style={{marginTop:42}}>
      <span className="eyebrow"><Sparkles size={15}/> TUCITA PARA TU NEGOCIO</span>
      <h1>Empieza hoy: prueba gratis o activa tu plan de una vez.</h1>
      <p className="muted">Primero puedes ver los costos y elegir el plan que te conviene. Puedes comenzar con 15 días de prueba gratis o activar TUCITA de una vez.</p>
      <a href="#planes" className="trial-cta">
        <span><strong>Regístrate y disfruta 15 días de prueba gratis</strong><small>Elige tu plan abajo. No necesitas pagar para comenzar la prueba.</small></span>
        <span className="trial-arrow"><ArrowDown size={24}/></span>
      </a>
    </div>


    <section className="panel" style={{marginTop:20,marginBottom:18}}>
      <div className="demo-head" style={{marginBottom:14}}>
        <span className="eyebrow">ANTES Y DESPUÉS</span>
        <h2 style={{fontSize:30,margin:'10px 0'}}>Menos tareas manuales. Más claridad al reservar.</h2>
        <p className="muted">Compara una agenda repartida en mensajes con el flujo organizado de TUCITA.</p>
      </div>
      <div className="panel-grid">
        <div className="card" style={{background:'#fff8f6'}}>
          <h3 style={{marginTop:0}}>Sin TUCITA</h3>
          <div style={{display:'grid',gap:10}}>
            <div className="notice" style={{background:'#fff',color:'#82483c'}}>✕ Confirmar disponibilidad por mensajes.</div>
            <div className="notice" style={{background:'#fff',color:'#82483c'}}>✕ Recordar precios y duración en cada conversación.</div>
            <div className="notice" style={{background:'#fff',color:'#82483c'}}>✕ Buscar referencias y comprobantes en varios chats.</div>
            <div className="notice" style={{background:'#fff',color:'#82483c'}}>✕ Revisar manualmente cuáles citas están confirmadas.</div>
          </div>
        </div>
        <div className="card" style={{borderColor:'#8acdbb',background:'#f2fbf8'}}>
          <span className="pill">CON TUCITA</span>
          <h3>Una agenda clara para todos</h3>
          <div style={{display:'grid',gap:10}}>
            <div className="notice"><CheckCircle2 size={16}/> Horarios publicados en un enlace de reservas.</div>
            <div className="notice"><CheckCircle2 size={16}/> Cada servicio muestra precio y duración.</div>
            <div className="notice"><CheckCircle2 size={16}/> Pagos y comprobantes asociados a cada reserva.</div>
            <div className="notice"><CheckCircle2 size={16}/> El cliente y el profesional consultan el estado de la cita.</div>
          </div>
        </div>
      </div>
      <div className="notice" style={{marginTop:14,textAlign:'center',fontSize:15}}>
        <strong>El resultado:</strong> reservas, disponibilidad y pagos en un mismo lugar.
      </div>
    </section>

    <BillingPlans/>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:18,flexWrap:'wrap'}}>
        <div style={{maxWidth:760}}>
          <span className="eyebrow"><ShieldCheck size={15}/> CÓMO FUNCIONA EL PAGO</span>
          <h2 style={{marginTop:12}}>Pago enviado → verificación → activación</h2>
          <p className="muted">El cliente crea su cuenta, selecciona PayPal o Binance, registra la referencia y sube el comprobante. El Master verifica el pago y activa la cuenta. Mientras tanto, si todavía está dentro de sus 15 días de prueba, puede seguir probando TUCITA.</p>
        </div>
        <Link href="/demo" className="btn btn-secondary">Primero quiero ver el demo <ArrowRight size={16}/></Link>
      </div>
    </section>
  </div></main>;
}
