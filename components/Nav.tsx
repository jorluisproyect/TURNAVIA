import Link from "next/link";
import { Brand } from "./Brand";
import { InstallAppButton } from './InstallAppButton';

export function Nav(){
  return <nav className="nav"><div className="container nav-inner"><Brand/><div className="nav-links"><a href="#como-funciona">Cómo funciona</a><a href="#beneficios">Beneficios</a><a href="#clinicas">Para clínicas</a></div><div className="nav-actions"><InstallAppButton/><Link className="btn btn-secondary" href="/ingresar">Ingresar</Link><Link className="btn btn-primary" href="/demo">Ver demo</Link></div></div></nav>
}
