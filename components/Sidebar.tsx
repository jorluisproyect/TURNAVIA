'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Brand } from "./Brand";
import { CalendarDays, LayoutDashboard, Users, Clock3, Building2, Settings, HeartPulse, UserRound, BarChart3, BriefcaseBusiness, Search } from "lucide-react";

const config = {
  medico: [
    ["/medico", "Resumen", LayoutDashboard],
    ["/medico#agenda", "Agenda", CalendarDays],
    ["/medico#servicios", "Servicios", BriefcaseBusiness],
    ["/medico#pagos", "Pagos", BarChart3],
    ["/medico#perfil", "Perfil", Settings],
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
  ],
  master: [
    ["/master", "Resumen", LayoutDashboard],
    ["/master/clientes", "Clientes", Building2],
    ["/master/profesionales", "Profesionales", HeartPulse],
    ["/master/suscripciones", "Suscripciones", BarChart3],
    ["/master/configuracion", "Configuración", Settings],
  ],
} as const;

export function Sidebar({role}:{role:keyof typeof config}){
  const pathname=usePathname();
  return <aside className="sidebar"><Brand/>{config[role].map(([href,label,Icon])=>{
    const path=String(href).split('#')[0];
    const active=pathname===path && !String(href).includes('#');
    return <Link key={label} href={href} className={`side-link ${active?"active":""}`}><Icon size={18}/>{label}</Link>
  })}</aside>
}
