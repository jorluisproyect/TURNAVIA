import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, HeartPulse, Route, Smartphone, UsersRound, BellRing, ArrowRight, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";

export default function Home(){
 return <>
  <Nav/>
  <main className="container">
   <section className="hero">
    <div>
      <span className="eyebrow"><HeartPulse size={16}/> Citas, turnos y reservas para cualquier servicio</span>
      <h1>Tu servicio, <span>a tu hora.</span></h1>
      <p>Turnavia conecta profesionales, negocios y clientes en una sola agenda. Publicas disponibilidad, el cliente reserva, registra su pago y el negocio organiza todo desde un mismo lugar.</p>
      <div className="hero-actions"><Link className="btn btn-primary" href="/demo">Explorar demo <ArrowRight size={17}/></Link><Link className="btn btn-secondary" href="/registro?role=DOCTOR">Crear mi cuenta</Link><Link className="btn btn-secondary" href="/explorar">Explorar servicios</Link></div>
      <div className="hero-proof"><span><CheckCircle2 size={16}/> Sin instalar nada</span><span><CheckCircle2 size={16}/> Funciona en móvil y PC</span><span><CheckCircle2 size={16}/> Diseñado para crecer globalmente</span></div>
    </div>
    <div className="phone-wrap">
      <div className="blob"/>
      <div className="phone"><div className="phone-screen">
        <div className="phone-top"><strong>Reservar servicio</strong><span className="pill">Disponible</span></div>
        <div className="doctor-card"><div className="row"><div className="avatar">SM</div><div><strong>Dra. Sofía Mendoza</strong><div className="muted" style={{fontSize:13,marginTop:4}}>Cardiología · Caracas</div></div></div>
          <div style={{marginTop:18,fontSize:13,fontWeight:800}}>Jueves 24 de septiembre</div>
          <div className="slot-grid"><div className="slot active">8:00</div><div className="slot">8:30</div><div className="slot">9:00</div><div className="slot">9:30</div><div className="slot">10:00</div><div className="slot">10:30</div></div>
        </div>
        <div className="notice" style={{marginTop:14}}>Tu reserva queda registrada y el profesional la gestiona desde su panel.</div>
      </div></div>
    </div>
   </section>
   <section className="section" id="como-funciona"><div className="section-title"><span className="eyebrow"><Route size={15}/> Un solo flujo</span><h2>Un solo sistema para muchos rubros.</h2><p>Salud, barbería, spa, uñas, servicios profesionales, automotriz, mascotas y más comparten el mismo motor de reservas.</p></div><div className="grid-3">
    <div className="card"><div className="iconbox"><HeartPulse/></div><h3>El profesional publica</h3><p>Define servicios, sede, días, horarios, duración y precios desde cualquier lugar.</p></div>
    <div className="card"><div className="iconbox"><CalendarCheck2/></div><h3>El cliente reserva</h3><p>Abre un enlace, elige servicio, fecha y hora disponible y deja su reserva en pocos pasos.</p></div>
    <div className="card"><div className="iconbox"><UsersRound/></div><h3>El negocio coordina</h3><p>Visualiza reservas, confirma pagos, gestiona horarios y organiza la operación diaria.</p></div>
   </div></section>
   <section className="section" id="beneficios"><div className="section-title"><span className="eyebrow"><Clock3 size={15}/> Menos espera</span><h2>La experiencia empieza antes de llegar.</h2><p>Disponibilidad, reserva, pago, confirmación, cambios y atención forman parte del mismo flujo.</p></div><div className="grid-3">
    <div className="card"><div className="iconbox"><BellRing/></div><h3>Estado en tiempo real</h3><p>El cliente puede consultar el estado de su reserva y recibir actualizaciones.</p></div>
    <div className="card"><div className="iconbox"><Smartphone/></div><h3>Estoy en camino</h3><p>El cliente puede avisar que va en camino o que ya llegó cuando el tipo de servicio lo necesite.</p></div>
    <div className="card"><div className="iconbox"><ShieldCheck/></div><h3>Núcleo adaptable</h3><p>El mismo núcleo se adapta por rubro y muestra solo las funciones necesarias para cada actividad.</p></div>
   </div></section>
   <section className="section" id="clinicas"><div className="band"><div><h2>Una demo que ya se puede enseñar.</h2><p>Entra como Master, profesional/negocio o cliente y recorre el flujo comercial completo del producto.</p></div><Link className="btn btn-primary" href="/demo">Abrir Turnavia <ArrowRight size={17}/></Link></div></section>
  </main>
  <footer className="footer"><div className="container footer-inner"><div><strong>Turnavia</strong> · Tu servicio, a tu hora.</div><div>Demo multirrubro · Reservas inteligentes</div></div></footer>
 </>
}
