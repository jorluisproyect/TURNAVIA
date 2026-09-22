import Link from 'next/link';
import { Brand } from '@/components/Brand';
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
      <p className="muted">Primero puedes ver los costos y elegir el plan que te conviene. Puedes comenzar con 5 días de prueba gratis o activar TUCITA de una vez.</p>
      <a href="#planes" className="trial-cta">
        <span><strong>Regístrate y disfruta 5 días de prueba gratis</strong><small>Elige tu plan abajo. No necesitas pagar para comenzar la prueba.</small></span>
        <span className="trial-arrow"><ArrowDown size={24}/></span>
      </a>
    </div>

    <div id="planes" className="panel-grid" style={{marginTop:18,scrollMarginTop:24}}>
      <section className="panel">
        <span className="eyebrow">PROFESIONAL INDEPENDIENTE</span>
        <h2 style={{fontSize:34,margin:'14px 0 4px'}}>$40 <span className="muted" style={{fontSize:14,fontWeight:500}}>inicial</span></h2>
        <p className="muted">$25 activación + $15 primer mes. Luego $15/mes.</p>
        <div style={{display:'grid',gap:8,margin:'16px 0'}}>
          <div className="notice"><CheckCircle2 size={16}/> Agenda y disponibilidad</div>
          <div className="notice"><CheckCircle2 size={16}/> Servicios, duración y precios</div>
          <div className="notice"><CheckCircle2 size={16}/> Reservas, pagos y comprobantes</div>
          <div className="notice"><CheckCircle2 size={16}/> 5 días de prueba sin tarjeta</div>
        </div>
        <div className="button-row">
          <Link href="/registro?role=DOCTOR&type=PROFESSIONAL" className="btn btn-secondary">Probar 5 días</Link>
          <Link href="/registro?role=DOCTOR&type=PROFESSIONAL&buy=1" className="btn btn-primary"><CreditCard size={16}/> Comprar / activar ahora</Link>
        </div>
      </section>

      <section className="panel">
        <span className="eyebrow">NEGOCIO / LOCAL</span>
        <h2 style={{fontSize:34,margin:'14px 0 4px'}}>$149 <span className="muted" style={{fontSize:14,fontWeight:500}}>inicial</span></h2>
        <p className="muted">$100 activación + $49 primer mes. Luego $49/mes.</p>
        <div style={{display:'grid',gap:8,margin:'16px 0'}}>
          <div className="notice"><CheckCircle2 size={16}/> Hasta 5 profesionales</div>
          <div className="notice"><CheckCircle2 size={16}/> Agenda y servicios por profesional</div>
          <div className="notice"><CheckCircle2 size={16}/> Página pública del negocio</div>
          <div className="notice"><CheckCircle2 size={16}/> 5 días de prueba sin tarjeta</div>
        </div>
        <div className="button-row">
          <Link href="/registro?role=DOCTOR&type=BUSINESS" className="btn btn-secondary">Probar 5 días</Link>
          <Link href="/registro?role=DOCTOR&type=BUSINESS&buy=1" className="btn btn-primary"><CreditCard size={16}/> Comprar / activar ahora</Link>
        </div>
      </section>
    </div>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:18,flexWrap:'wrap'}}>
        <div style={{maxWidth:760}}>
          <span className="eyebrow"><ShieldCheck size={15}/> CÓMO FUNCIONA EL PAGO</span>
          <h2 style={{marginTop:12}}>Pago enviado → verificación → activación</h2>
          <p className="muted">El cliente crea su cuenta, selecciona PayPal o Binance, registra la referencia y sube el comprobante. El Master verifica el pago y activa la cuenta. Mientras tanto, si todavía está dentro de sus 5 días de prueba, puede seguir probando TUCITA.</p>
        </div>
        <Link href="/demo" className="btn btn-secondary">Primero quiero ver el demo <ArrowRight size={16}/></Link>
      </div>
    </section>
  </div></main>;
}
