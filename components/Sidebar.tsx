'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Brand } from "./Brand";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";
import { CalendarDays, LayoutDashboard, Users, Building2, Settings, HeartPulse, UserRound, BarChart3, BriefcaseBusiness, Search, WalletCards, Menu, X, ScanLine, MapPin, ShieldCheck, RotateCcw } from "lucide-react";
import { providerAudienceLabel } from "@/lib/provider-labels";
import { useEffect,useState } from "react";

const config = {
  medico: [
    ["/medico", "Resumen", LayoutDashboard],
    ["/medico/agenda", "Agenda", CalendarDays],
    ["/medico/servicios", "Servicios", BriefcaseBusiness],
    ["/medico/clientes", "__AUDIENCE__", Users],
    ["/medico/equipo", "Equipo", Users],
    ["/medico/pagos-reservas", "Pagos y reservas", BarChart3],
    ["/medico#perfil", "Perfil", Settings],
    ["/medico/finanzas", "Finanzas", WalletCards],
    ["/cuenta/seguridad", "Seguridad", Settings],
  ],
  recepcion: [
    ["/recepcion", "Resumen", LayoutDashboard],
    ["/recepcion/agenda", "Agenda general", CalendarDays],
    ["/recepcion/medicos", "Profesionales", HeartPulse],
    ["/recepcion/pacientes", "Clientes", Users],
    ["/recepcion/sedes", "Sedes", Building2],
  ],
  paciente: [
    ["/paciente", "Mis reservas", CalendarDays],
    ["/explorar", "Reservar", Search],
    ["/paciente/profesionales", "Mis profesionales", UserRound],
    ["/paciente/perfil", "Perfil", Settings],
    ["/cuenta/seguridad", "Seguridad", Settings],
  ],
  masterTeam: [
    ["/master", "Mi espacio Master", LayoutDashboard],
    ["/cuenta/seguridad", "Seguridad", ShieldCheck],
  ],
  master: [
    ["/master", "Resumen", LayoutDashboard],
    ["/master/profesionales", "Profesionales", HeartPulse],
    ["/master/usuarios", "Usuarios finales", UserRound],
    ["/master/clientes", "Cuentas comerciales", Building2],
    ["/master/suscripciones", "Suscripciones", BarChart3],
    ["/master/finanzas", "Finanzas", WalletCards],
    ["/master/equipo", "Equipo de trabajo", Users],
    ["/master/eliminados", "Perfiles eliminados", RotateCcw],
    ["/master/configuracion", "Configuración", Settings],
    ["/cuenta/seguridad", "Seguridad", Settings],
  ],
} as const;

export function Sidebar({role}:{role:keyof typeof config}){
  const pathname=usePathname();
  const [audience,setAudience]=useState('Clientes');
  const [business,setBusiness]=useState(false);
  const [moreOpen,setMoreOpen]=useState(false);
  const [hash,setHash]=useState('');

  useEffect(()=>{
    const sync=()=>setHash(window.location.hash||'');
    sync();
    window.addEventListener('hashchange',sync);
    return ()=>window.removeEventListener('hashchange',sync);
  },[pathname]);

  useEffect(()=>{
    if(role!=='medico')return;
    fetch('/api/me/provider').then(r=>r.json()).then(j=>{
      setAudience(providerAudienceLabel(j?.provider?.category,j?.provider?.activity));
      setBusiness(String(j?.provider?.type||'').toLowerCase().includes('negocio'));
    }).catch(()=>{});
  },[role]);

  function activeFor(href:string){
    const [path,anchor]=String(href).split('#');
    if(pathname!==path)return false;
    if(anchor)return hash==='#'+anchor;
    return !hash;
  }

  const mobilePrimary:any[]=
    role==='paciente'?[
      ['/paciente','Inicio',LayoutDashboard],
      ['/explorar','Explorar',Search],
      ['/paciente#reservas','Citas',CalendarDays],
      ['/paciente/profesionales','Profesionales',UserRound],
      ['/paciente/perfil','Perfil',Settings],
    ]:
    role==='recepcion'?[
      ['/recepcion','Hoy',LayoutDashboard],
      ['/recepcion/agenda','Agenda',CalendarDays],
      ['/scan','QR',ScanLine],
      ['/recepcion/pacientes','Clientes',Users],
      ['__more__','Más',Menu],
    ]:
    role==='masterTeam'?[
      ['/master','Mi espacio',LayoutDashboard],
      ['/cuenta/seguridad','Seguridad',ShieldCheck],
      ['__more__','Más',Menu],
    ]:
    role==='master'?[
      ['/master','Resumen',LayoutDashboard],
      ['/master/profesionales','Profesionales',HeartPulse],
      ['/master/usuarios','Usuarios',UserRound],
      ['/master/suscripciones','Pagos',WalletCards],
      ['__more__','Más',Menu],
    ]:[
      ['/medico','Inicio',LayoutDashboard],
      ['/medico/agenda','Agenda',CalendarDays],
      [business?'/medico/equipo':'/medico/clientes',business?'Equipo':audience,business?Users:Users],
      ['/medico/finanzas','Finanzas',WalletCards],
      ['__more__','Más',Menu],
    ];

  const mobileMore:any[]=
    role==='recepcion'?[
      ['/recepcion/medicos','Profesionales',HeartPulse],
      ['/recepcion/sedes','Sedes',Building2],
    ]:
    role==='masterTeam'?[]:
    role==='master'?[
      ['/master/clientes','Cuentas comerciales',Building2],
      ['/master/finanzas','Finanzas',WalletCards],
      ['/master/equipo','Equipo de trabajo',Users],
      ['/master/eliminados','Perfiles eliminados',RotateCcw],
      ['/master/configuracion','Configuración',Settings],
      ['/cuenta/seguridad','Seguridad',ShieldCheck],
    ]:
    role==='medico'?[
      ['/medico/servicios','Servicios',BriefcaseBusiness],
      ['/medico#ubicaciones','Ubicaciones',MapPin],
      ['/medico/pagos-reservas','Pagos y reservas',BarChart3],
      ['/medico#perfil','Perfil',Settings],
      ['/cuenta/seguridad','Seguridad',ShieldCheck],
    ]:[];

  return <>
    <aside className="sidebar desktop-sidebar"><Brand/>{config[role].map(([href,label,Icon])=>{
      const active=activeFor(String(href));
      const visibleLabel=label==='__AUDIENCE__'?audience:label;
      return <Link key={String(href)} href={href} className={`side-link ${active?"active":""}`}><Icon size={18}/>{visibleLabel}</Link>
    })}<div style={{marginTop:'auto',display:'grid',gap:6}}><NotificationBell/><LogoutButton/></div></aside>

    <nav className={`mobile-bottom-nav ${role==='masterTeam'?'mobile-bottom-nav-compact':''}`} aria-label="Navegación principal">
      {mobilePrimary.map(([href,label,Icon])=>href==='__more__'
        ?<button key="more" type="button" className={`mobile-nav-item ${moreOpen?'active':''}`} onClick={()=>setMoreOpen(v=>!v)}><Icon size={21}/><span>{label}</span></button>
        :<Link key={href} href={href} onClick={()=>setMoreOpen(false)} className={`mobile-nav-item ${activeFor(href)?'active':''}`}><Icon size={21}/><span>{label}</span></Link>
      )}
    </nav>

    {moreOpen&&<div className="mobile-more-layer">
      <button type="button" className="mobile-more-backdrop" aria-label="Cerrar menú" onClick={()=>setMoreOpen(false)}/>
      <section className="mobile-more-sheet" aria-label="Más opciones">
        <div className="row space" style={{gap:12}}><div><strong>Más opciones</strong><div className="muted" style={{fontSize:12}}>Lo menos frecuente, sin llenar tu pantalla.</div></div><button type="button" className="mobile-sheet-close" onClick={()=>setMoreOpen(false)}><X size={20}/></button></div>
        <div className="mobile-more-links">{mobileMore.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setMoreOpen(false)} className="mobile-more-link"><span className="iconbox"><Icon size={18}/></span><span>{label}</span></Link>)}</div>
        <div className="mobile-more-account"><NotificationBell mobile/><LogoutButton/></div>
      </section>
    </div>}
  </>;
}
