import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Brand } from '@/components/Brand';
import { MASTER_TEAM_ROLES, type MasterTeamMember } from '@/lib/master-team';
import { BriefcaseBusiness, CheckCircle2, Github, LockKeyhole } from 'lucide-react';

export default function TeamMasterDashboard({member}:{member:MasterTeamMember}){
  return <div className="dashboard"><Sidebar role="masterTeam"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>TUCITA · Master colaborador</div><h1>Mi espacio de trabajo</h1></div><span className="pill"><CheckCircle2 size={15}/> Acceso activo</span></div>
    <section className="panel">
      <span className="eyebrow"><BriefcaseBusiness size={15}/> EQUIPO INTERNO</span>
      <h2 style={{fontSize:25,margin:'12px 0 8px'}}>Hola, {member.name}</h2>
      <p className="muted" style={{marginBottom:14}}>Área asignada: <strong>{MASTER_TEAM_ROLES[member.role]}</strong> · {member.email}</p>
      <div className="notice"><LockKeyhole size={18}/> Tu acceso Master es de colaboración. Los cobros, clientes, comprobantes de pago, configuración y permisos del equipo son exclusivos del Master propietario.</div>
    </section>
    <section className="panel" style={{marginTop:16}} id="proyecto">
      <h2>Proyecto TUCITA</h2>
      <p className="muted">Trabaja en tu área a través de las herramientas del equipo. El acceso a GitHub, Neon o Vercel se concede por separado, según tu responsabilidad.</p>
      <div className="button-row" style={{marginTop:12}}>
        <a className="btn btn-primary" href="https://github.com/jorluisproyect/TURNAVIA" target="_blank" rel="noreferrer"><Github size={17}/> Ver repositorio</a>
        <Link className="btn btn-secondary" href="/cuenta/seguridad">Seguridad de mi cuenta</Link>
      </div>
    </section>
  </main></div>;
}
