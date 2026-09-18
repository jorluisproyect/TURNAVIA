'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, RotateCcw, ShieldCheck, Stethoscope, UserRound, X } from 'lucide-react';

export function GlobalDemoBar(){
  const pathname=usePathname();
  const search=useSearchParams();
  const router=useRouter();
  const isDemo=search.get('demo')==='1';
  if(!isDemo) return null;
  const current=pathname.startsWith('/medico')?'medico':pathname.startsWith('/recepcion')?'recepcion':pathname.startsWith('/master')?'master':'paciente';
  async function reset(){
    await fetch('/api/demo',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'reset_demo'})});
    router.push('/medico?demo=1');
    router.refresh();
  }
  return <div className="demo-switcher">
    <div className="demo-switcher-inner">
      <div className="demo-badge">DEMO EN VIVO</div>
      <nav className="demo-role-tabs" aria-label="Cambiar rol de la demo">
        <Link href="/medico?demo=1" className={`demo-role-tab ${current==='medico'?'active':''}`}><Stethoscope size={15}/>Médico</Link>
        <Link href="/reservar/sofia-mendoza?demo=1" className={`demo-role-tab ${current==='paciente'?'active':''}`}><UserRound size={15}/>Paciente</Link>
        <Link href="/recepcion?demo=1" className={`demo-role-tab ${current==='recepcion'?'active':''}`}><Building2 size={15}/>Recepción</Link>
      </nav>
      <div className="demo-switcher-actions">
        <Link href="/master?demo=1" className={`demo-mini-link ${current==='master'?'active':''}`}><ShieldCheck size={14}/>Master</Link>
        <button className="demo-mini-link" onClick={reset}><RotateCcw size={14}/>Reiniciar</button>
        <Link href="/demo" className="demo-mini-link"><X size={14}/>Salir</Link>
      </div>
    </div>
    <div className="demo-hint">
      {current==='medico'&&<><strong>1 · Médico:</strong> publica horarios o marca un retraso. Después cambia a <b>Paciente</b>.</>}
      {current==='paciente'&&<><strong>2 · Paciente:</strong> reserva una cita con la Dra. Sofía. Después cambia a <b>Recepción</b>.</>}
      {current==='recepcion'&&<><strong>3 · Recepción:</strong> la misma cita aparece aquí. Registra llegada, consulta y finalización.</>}
      {current==='master'&&<><strong>Panel interno TURNAVIA:</strong> esta vista es nuestra y no forma parte del acceso normal del cliente.</>}
    </div>
  </div>
}
