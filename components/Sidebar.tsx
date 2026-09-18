'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Brand } from "./Brand";
import { CalendarDays, LayoutDashboard, Users, Clock3, Building2, Settings, HeartPulse, UserRound, BarChart3 } from "lucide-react";

const config = {
  medico: [
    ["/medico", "Resumen", LayoutDashboard], ["/medico", "Mi agenda", CalendarDays], ["/medico", "Disponibilidad", Clock3], ["/medico", "Pacientes", Users], ["/medico", "Configuración", Settings],
  ],
  recepcion: [
    ["/recepcion", "Resumen", LayoutDashboard], ["/recepcion/agenda", "Agenda general", CalendarDays], ["/recepcion/medicos", "Médicos", HeartPulse], ["/recepcion/pacientes", "Pacientes", Users], ["/recepcion/sedes", "Sedes", Building2],
  ],
  paciente: [
    ["/paciente", "Mis citas", CalendarDays], ["/reservar/sofia-mendoza", "Reservar", HeartPulse], ["/paciente", "Mis médicos", UserRound], ["/paciente", "Perfil", Settings],
  ],
  master: [
    ["/master", "Resumen", LayoutDashboard], ["/master", "Clientes", Building2], ["/master", "Médicos", HeartPulse], ["/master", "Suscripciones", BarChart3], ["/master", "Configuración", Settings],
  ],
} as const;

export function Sidebar({role}:{role:keyof typeof config}){
  const pathname=usePathname();
  return <aside className="sidebar"><Brand/>{config[role].map(([href,label,Icon])=>{
    const active=pathname===href;
    return <Link key={label} href={href} className={`side-link ${active?"active":""}`}><Icon size={18}/>{label}</Link>
  })}</aside>
}
