import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { Building2, HeartPulse, ShieldCheck, UserRound, ArrowRight } from 'lucide-react';
const roles=[
 {href:'/medico',title:'Médico',desc:'Agenda, disponibilidad y pacientes.',Icon:HeartPulse},
 {href:'/recepcion',title:'Clínica / Recepción',desc:'Control de agenda y llegadas.',Icon:Building2},
 {href:'/paciente',title:'Paciente',desc:'Mis citas y estado de atención.',Icon:UserRound},
 {href:'/master',title:'Administración Turnavia',desc:'Clientes, ingresos y operación.',Icon:ShieldCheck},
];
export default function Ingresar(){return <main className="demo-chooser"><div className="container"><div className="row space"><Brand/><Link className="btn btn-secondary" href="/">Inicio</Link></div><div className="demo-head"><span className="eyebrow">Acceso al MVP</span><h1>¿Cómo quieres entrar?</h1><p className="muted">En la demostración no pedimos contraseña para que puedas presentar todos los módulos rápidamente. La autenticación segura se activa antes de producción.</p></div><div className="role-grid">{roles.map(({href,title,desc,Icon})=><Link href={href} className="role-card" key={title}><div className="iconbox"><Icon/></div><h3>{title}</h3><p>{desc}</p><div className="go">Entrar <ArrowRight size={16}/></div></Link>)}</div></div></main>}
