'use client';

import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, UserRound } from 'lucide-react';

const statusLabel:Record<string,string>={
  PAYMENT_REVIEW:'Pago en revisión',
  PAYMENT_REJECTED:'Pago rechazado',
  CONFIRMED:'Confirmada',
  ON_THE_WAY:'En camino',
  ARRIVED:'Llegó',
  IN_CONSULTATION:'En atención',
  COMPLETED:'Completada',
  CANCELLED:'Cancelada',
  NO_SHOW:'No asistió'
};

function isoDate(d:Date){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function startOfWeek(input:Date){
  const d=new Date(input);d.setHours(12,0,0,0);
  const day=d.getDay();
  const diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return d;
}
function addDays(value:string,days:number){
  const d=new Date(value+'T12:00:00');d.setDate(d.getDate()+days);return isoDate(d);
}
function localKey(value:string){
  return new Date(value).toLocaleDateString('en-CA',{timeZone:'America/Caracas'});
}
function localTime(value:string){
  return new Date(value).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
}

export default function AgendaAlmanaque(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [weekStart,setWeekStart]=useState(()=>isoDate(startOfWeek(new Date())));

  useEffect(()=>{
    fetch('/api/me/provider',{cache:'no-store'})
      .then(async r=>({ok:r.ok,j:await r.json()}))
      .then(({ok,j})=>{if(!ok){setError(j.error||'No se pudo abrir tu agenda.');return}setData(j);setError('')})
      .catch(()=>setError('No se pudo conectar con TUCITA.'));
  },[]);

  const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(weekStart,i)),[weekStart]);
  const appointments=useMemo(()=>((data?.appointments||[]) as any[])
    .filter(a=>days.includes(localKey(a.startsAt)))
    .sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime()),[data,days]);
  const availability=useMemo(()=>((data?.availability||[]) as any[])
    .filter(a=>days.includes(localKey(a.startsAt)))
    .sort((a,b)=>new Date(a.startsAt).getTime()-new Date(b.startsAt).getTime()),[data,days]);

  const title=useMemo(()=>{
    const a=new Date(days[0]+'T12:00:00'),b=new Date(days[6]+'T12:00:00');
    const same=a.getMonth()===b.getMonth();
    return same
      ?a.toLocaleDateString('es-VE',{month:'long',year:'numeric'})
      :a.toLocaleDateString('es-VE',{month:'short'})+' – '+b.toLocaleDateString('es-VE',{month:'short',year:'numeric'});
  },[days]);

  const today=isoDate(new Date());
  const activeCount=appointments.filter(a=>!['CANCELLED','PAYMENT_REJECTED'].includes(String(a.status))).length;

  return <div className="dashboard">
    <Sidebar role="medico"/>
    <main className="main agenda-calendar-page">
      <div className="topbar">
        <div>
          <div className="muted" style={{fontSize:13}}>Agenda visual</div>
          <h1>Almanaque de citas</h1>
          <div className="muted" style={{fontSize:13,marginTop:5}}>Personas, horas y lugares organizados por semana sin cambiar tu Resumen.</div>
        </div>
        <Link href="/medico" className="btn btn-secondary">Volver al resumen</Link>
      </div>

      <section className="panel agenda-calendar-shell">
        <div className="agenda-calendar-toolbar">
          <div>
            <span className="eyebrow"><CalendarDays size={15}/> AGENDA</span>
            <h2 className="agenda-calendar-title">{title}</h2>
          </div>
          <div className="button-row">
            <button className="btn btn-secondary" onClick={()=>setWeekStart(addDays(weekStart,-7))} aria-label="Semana anterior"><ChevronLeft size={17}/> Anterior</button>
            <button className="btn btn-secondary" onClick={()=>setWeekStart(isoDate(startOfWeek(new Date())))}>Hoy</button>
            <button className="btn btn-secondary" onClick={()=>setWeekStart(addDays(weekStart,7))}>Siguiente <ChevronRight size={17}/></button>
          </div>
        </div>

        {error&&<div className="notice danger" style={{marginTop:14}}>{error}</div>}
        {!data&&!error&&<div className="notice" style={{marginTop:14}}>Cargando tu almanaque…</div>}

        {data&&<>
          <div className="agenda-calendar-kpis">
            <span><strong>{activeCount}</strong> cita{activeCount===1?'':'s'} esta semana</span>
            <span><strong>{availability.length}</strong> bloque{availability.length===1?'':'s'} publicado{availability.length===1?'':'s'}</span>
          </div>

          <div className="agenda-week-grid">
            {days.map(day=>{
              const dayApps=appointments.filter(a=>localKey(a.startsAt)===day);
              const dayAvailability=availability.filter(a=>localKey(a.startsAt)===day);
              const date=new Date(day+'T12:00:00');
              const isToday=day===today;
              return <section className={'agenda-day '+(isToday?'today':'')} key={day}>
                <header className="agenda-day-head">
                  <div>
                    <small>{date.toLocaleDateString('es-VE',{weekday:'long'})}</small>
                    <strong>{date.getDate()}</strong>
                  </div>
                  {isToday&&<span>Hoy</span>}
                </header>

                {dayAvailability.length>0&&<div className="agenda-availability-list">
                  {dayAvailability.map((a:any)=><div key={a.id} className="agenda-availability">
                    <Clock3 size={12}/>
                    <span>{localTime(a.startsAt)}–{localTime(a.endsAt)}</span>
                    <small>{a.location?.name||'Disponible'}</small>
                  </div>)}
                </div>}

                <div className="agenda-day-events">
                  {dayApps.length===0
                    ?<div className="agenda-empty-day">Sin citas</div>
                    :dayApps.map((a:any)=><article className={'agenda-event status-'+String(a.status||'').toLowerCase()} key={a.id}>
                      <div className="agenda-event-time">{localTime(a.startsAt)}</div>
                      <div className="agenda-event-person"><UserRound size={13}/><strong>{a.clientName}</strong></div>
                      <div className="agenda-event-service">{a.serviceName}</div>
                      <div className="agenda-event-location"><MapPin size={12}/>{a.location?.name||'Ubicación'}</div>
                      <span className="agenda-event-status">{statusLabel[a.status]||a.status}</span>
                    </article>)}
                </div>
              </section>;
            })}
          </div>

          <div className="notice" style={{marginTop:16}}>
            <strong>Tip:</strong> este almanaque es para visualizar citas y disponibilidad de forma rápida. Para crear o eliminar disponibilidad, vuelve a <strong>Resumen → Calendario de disponibilidad</strong>.
          </div>
        </>}
      </section>
    </main>
  </div>;
}
