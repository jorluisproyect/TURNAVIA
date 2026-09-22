'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Brand } from "./Brand";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";
import { CalendarDays, LayoutDashboard, Users, Clock3, Building2, Settings, HeartPulse, UserRound, BarChart3, BriefcaseBusiness, Search } from "lucide-react";
import { providerAudienceLabel } from "@/lib/provider-labels";
import { useEffect,useState } from "react";

const config = {
  medico: [
    ["/medico", "Resumen", LayoutDashboard],
    ["/medico#agenda", "Agenda", CalendarDays],
    ["/medico#servicios", "Servicios", BriefcaseBusiness],
    ["/medico/clientes", "__AUDIENCE__", Users],
    ["/medico/equipo", "Equipo", Users],
    ["/medico#pagos", "Pagos", BarChart3],
    ["/medico#perfil", "Perfil", Settings],
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
  master: [
    ["/master", "Resumen", LayoutDashboard],
    ["/master/clientes", "Clientes", Building2],
    ["/master/profesionales", "Profesionales", HeartPulse],
    ["/master/suscripciones", "Suscripciones", BarChart3],
    ["/master/configuracion", "Configuración", Settings],
    ["/cuenta/seguridad", "Seguridad", Settings],
  ],
} as const;

export function Sidebar({role}:{role:keyof typeof config}){
  const pathname=usePathname();
  const [audience,setAudience]=useState('Clientes');
  useEffect(()=>{
    if(role!=='medico')return;
    fetch('/api/me/provider').then(r=>r.json()).then(j=>setAudience(providerAudienceLabel(j?.provider?.category,j?.provider?.activity))).catch(()=>{});
  },[role]);
  return <aside className="sidebar"><Brand/>{config[role].map(([href,label,Icon])=>{
    const path=String(href).split('#')[0];
    const active=pathname===path && !String(href).includes('#');
    const visibleLabel=label==='__AUDIENCE__'?audience:label;
    return <Link key={String(href)} href={href} className={`side-link ${active?"active":""}`}><Icon size={18}/>{visibleLabel}</Link>
  })}<div style={{marginTop:'auto',display:'grid',gap:6}}><NotificationBell/><LogoutButton/></div></aside>
}
