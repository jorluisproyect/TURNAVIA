import Link from "next/link";
import { ArrowRight, Building2, HeartPulse, ShieldCheck, UserRound, Route } from "lucide-react";
import { Brand } from "@/components/Brand";

const roles = [
 {href:"/medico?demo=1",title:"Médico",text:"Publica disponibilidad, revisa su agenda y conoce cuántos pacientes atenderá.",Icon:HeartPulse},
 {href:"/recepcion?demo=1",title:"Recepción / Clínica",text:"Coordina médicos, citas, llegadas, retrasos y disponibilidad desde una sola pantalla.",Icon:Building2},
 {href:"/reservar/sofia-mendoza?demo=1",title:"Paciente",text:"Consulta horarios y reserva una cita en pocos pasos, sin crear una cuenta obligatoriamente.",Icon:UserRound},
 {href:"/master?demo=1",title:"Master",text:"Panel interno para controlar clientes, suscripciones, médicos y crecimiento de Turnavia.",Icon:ShieldCheck},
];
export default function Demo(){return <main className="demo-chooser"><div className="container"><div className="row space"><Brand/><Link href="/" className="btn btn-secondary">Volver al inicio</Link></div><div className="demo-head"><span className="eyebrow"><Route size={15}/> Demo interactiva</span><h1>Elige cómo quieres ver Turnavia</h1><p className="muted">Prueba el mismo caso desde tres perspectivas. Lo que hagas como médico o paciente se refleja inmediatamente en recepción. Cambia de rol sin cerrar la demo.</p></div><div className="role-grid">{roles.map(({href,title,text,Icon})=><Link className="role-card" href={href} key={title}><div className="iconbox"><Icon/></div><h3>{title}</h3><p>{text}</p><div className="go">Entrar al módulo <ArrowRight size={16}/></div></Link>)}</div></div></main>}
