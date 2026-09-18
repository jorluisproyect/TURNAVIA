import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Clock3, HeartPulse, Route, Smartphone, UsersRound, BellRing, ArrowRight, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";

export default function Home(){
 return <>
  <Nav/>
  <main className="container">
   <section className="hero">
    <div>
      <span className="eyebrow"><HeartPulse size={16}/> Agenda médica simple, humana y en tiempo real</span>
      <h1>Tu consulta, <span>a tu hora.</span></h1>
      <p>Turnavia conecta médicos, recepción y pacientes en una sola agenda. El médico publica cuándo atiende, el paciente reserva y la clínica organiza todo sin filas innecesarias.</p>
      <div className="hero-actions"><Link className="btn btn-primary" href="/demo">Explorar demo <ArrowRight size={17}/></Link><Link className="btn btn-secondary" href="/activar">Quiero Turnavia</Link><Link className="btn btn-secondary" href="/reservar/sofia-mendoza">Probar como paciente</Link></div>
      <div className="hero-proof"><span><CheckCircle2 size={16}/> Sin instalar nada</span><span><CheckCircle2 size={16}/> Funciona en móvil y PC</span><span><CheckCircle2 size={16}/> Diseñado para crecer globalmente</span></div>
    </div>
    <div className="phone-wrap">
      <div className="blob"/>
      <div className="phone"><div className="phone-screen">
        <div className="phone-top"><strong>Reservar consulta</strong><span className="pill">Disponible</span></div>
        <div className="doctor-card"><div className="row"><div className="avatar">SM</div><div><strong>Dra. Sofía Mendoza</strong><div className="muted" style={{fontSize:13,marginTop:4}}>Cardiología · Caracas</div></div></div>
          <div style={{marginTop:18,fontSize:13,fontWeight:800}}>Jueves 24 de septiembre</div>
          <div className="slot-grid"><div className="slot active">8:00</div><div className="slot">8:30</div><div className="slot">9:00</div><div className="slot">9:30</div><div className="slot">10:00</div><div className="slot">10:30</div></div>
        </div>
        <div className="notice" style={{marginTop:14}}>Tu cita se confirma al instante y recepción la verá en su agenda.</div>
      </div></div>
    </div>
   </section>
   <section className="section" id="como-funciona"><div className="section-title"><span className="eyebrow"><Route size={15}/> Un solo flujo</span><h2>Tres personas. Una agenda.</h2><p>Turnavia elimina llamadas repetidas y agendas separadas. Cada rol ve exactamente lo que necesita.</p></div><div className="grid-3">
    <div className="card"><div className="iconbox"><HeartPulse/></div><h3>El médico publica</h3><p>Define sede, días, horario, duración por consulta y cantidad de pacientes desde cualquier lugar.</p></div>
    <div className="card"><div className="iconbox"><CalendarCheck2/></div><h3>El paciente reserva</h3><p>Abre un enlace, elige una hora disponible y recibe su cita sin tener que llamar o llegar de madrugada.</p></div>
    <div className="card"><div className="iconbox"><UsersRound/></div><h3>Recepción coordina</h3><p>Visualiza todos los médicos, confirma llegadas, mueve citas y gestiona pacientes que llaman por teléfono.</p></div>
   </div></section>
   <section className="section" id="beneficios"><div className="section-title"><span className="eyebrow"><Clock3 size={15}/> Menos espera</span><h2>La cita empieza antes de llegar a la clínica.</h2><p>Estado del médico, llegada del paciente, lista de espera y espacios liberados forman parte del mismo flujo.</p></div><div className="grid-3">
    <div className="card"><div className="iconbox"><BellRing/></div><h3>Estado en tiempo real</h3><p>El paciente puede saber si el médico está atendiendo normalmente o presenta retraso.</p></div>
    <div className="card"><div className="iconbox"><Smartphone/></div><h3>Estoy en camino</h3><p>El paciente avisa que va rumbo a la consulta o que ya llegó. Recepción lo ve inmediatamente.</p></div>
    <div className="card"><div className="iconbox"><ShieldCheck/></div><h3>MVP sin historia clínica</h3><p>La primera etapa se enfoca en agenda y operación. Los módulos clínicos sensibles quedan para una fase posterior.</p></div>
   </div></section>
   <section className="section" id="clinicas"><div className="band"><div><h2>Una demo que ya se puede enseñar.</h2><p>Entra al sistema como médico, recepción, paciente o administrador y recorre el flujo completo del producto.</p></div><Link className="btn btn-primary" href="/demo">Abrir Turnavia <ArrowRight size={17}/></Link></div></section>
  </main>
  <footer className="footer"><div className="container footer-inner"><div><strong>Turnavia</strong> · Tu consulta, a tu hora.</div><div>Demo MVP · Agenda médica inteligente</div></div></footer>
 </>
}
