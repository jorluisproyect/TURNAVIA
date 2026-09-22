import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { CheckCircle2, KeyRound, Link2, CreditCard, ShieldCheck, UsersRound } from 'lucide-react';
const steps=[
 ['1. Venta','El médico o la clínica conoce TUCITA y acepta el servicio.',CreditCard],
 ['2. Pago','Se confirma activación + primer mes antes de habilitar la cuenta.',CheckCircle2],
 ['3. Alta','Desde Master creamos la organización y el usuario administrador.',UsersRound],
 ['4. Contraseña','El cliente recibe su activación y crea su propia contraseña.',KeyRound],
 ['5. Configuración','Cargamos sede, especialidad, duración y primera disponibilidad.',ShieldCheck],
 ['6. Entrega','Entregamos panel + enlace público de reservas para compartir.',Link2],
] as const;
export default function Operacion(){return <main className="demo-chooser"><div className="container"><div className="row space"><Brand/><Link href="/master" className="btn btn-secondary">Panel Master</Link></div><div className="demo-head"><span className="eyebrow">Operación comercial</span><h1>Así se vende y se entrega TUCITA</h1><p className="muted">TUCITA es un SaaS: el cliente compra acceso al servicio, no una copia del código.</p></div><div className="role-grid">{steps.map(([t,d,Icon])=><div className="role-card" key={t}><div className="iconbox"><Icon/></div><h3>{t}</h3><p>{d}</p></div>)}</div><section className="panel" style={{marginTop:24}}><h2>Producto de lanzamiento</h2><div className="row" style={{alignItems:'stretch',gap:16,flexWrap:'wrap'}}><div className="notice" style={{flex:1,minWidth:260}}><strong>Médico independiente</strong><br/>USD 25 activación + USD 15/mes.<br/><span className="muted">Cuenta, panel médico, perfil público, enlace de reservas y configuración inicial.</span></div><div className="notice" style={{flex:1,minWidth:260}}><strong>Clínica pequeña · hasta 5 médicos</strong><br/>USD 100 activación + USD 49/mes.<br/><span className="muted">Panel clínica/recepción, médicos vinculados, agenda centralizada y configuración inicial.</span></div></div><div className="notice" style={{marginTop:16}}><strong>Paciente:</strong> no necesita crear usuario para la primera reserva. La cuenta del paciente será opcional en una fase posterior.</div></section></div></main>}
