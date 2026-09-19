'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarPlus, Copy, Plus, Trash2, Users, BriefcaseBusiness, ExternalLink } from 'lucide-react';

type Member={
  id:string;name:string;email:string;phone:string;slug:string;category:string;activity:string;isOwner:boolean;
  services:{id:string;name:string;description:string;durationMinutes:number;price:number;currency:string;active:boolean}[];
  availability:{id:string;startsAt:string;endsAt:string;slotMinutes:number;published:boolean}[];
};

export default function EquipoPage(){
  const [data,setData]=useState<any>(null);
  const [selected,setSelected]=useState('');
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [member,setMember]=useState({name:'',activity:'',category:'',phone:'',email:''});
  const [service,setService]=useState({name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
  const [av,setAv]=useState({date:'',start:'09:00',end:'17:00',slotMinutes:15});

  async function load(){
    try{
      const r=await fetch('/api/me/team');
      const j=await r.json();
      if(!r.ok){setError(j.error||'No se pudo abrir el equipo');return}
      setData(j);setError('');
      if(j.team?.length&&!selected)setSelected(j.team[0].id);
    }catch{setError('No se pudo conectar con TURNAVIA.')}
  }
  useEffect(()=>{load()},[]);
  const current:Member|undefined=useMemo(()=>data?.team?.find((m:Member)=>m.id===selected)||data?.team?.[0],[data,selected]);

  async function action(body:any){
    const r=await fetch('/api/me/team',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'No se pudo guardar');return false}
    setMsg('Cambios guardados');await load();setTimeout(()=>setMsg(''),1800);return true;
  }

  async function addMember(){
    const ok=await action({action:'add_member',...member});
    if(ok)setMember({name:'',activity:'',category:'',phone:'',email:''});
  }
  async function addService(){
    if(!current)return;
    const ok=await action({action:'add_service',doctorId:current.id,...service});
    if(ok)setService({name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
  }
  async function addAvailability(){
    if(!current)return;
    await action({action:'add_availability',doctorId:current.id,...av});
  }
  async function copy(text:string){
    await navigator.clipboard.writeText(text);setMsg('Enlace copiado');setTimeout(()=>setMsg(''),1500);
  }

  if(error&&!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><section className="panel"><h1>Equipo</h1><div className="notice danger">{error}</div></section></main></div>;
  if(!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main">Cargando equipo…</main></div>;
  if(!data.business)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><section className="panel"><h1>Equipo</h1><div className="notice">Tu cuenta es Profesional independiente. La gestión de hasta 5 profesionales está incluida en el plan Negocio / local.</div><Link className="btn btn-secondary" href="/medico" style={{marginTop:14}}>Volver al panel</Link></section></main></div>;

  const businessUrl=typeof window!=='undefined'?window.location.origin+'/negocio/'+data.organization.slug:'/negocio/'+data.organization.slug;

  return <div className="dashboard"><Sidebar role="medico"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Negocio / local</div><h1>Equipo de {data.organization.name}</h1></div><span className="pill">{data.team.length}/{data.maxProfessionals} profesionales</span></div>

    <section className="panel">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Página pública del negocio</h2><p className="muted">Comparte un solo enlace para que el cliente elija profesional.</p></div><div className="button-row"><button className="btn btn-secondary" onClick={()=>copy(businessUrl)}><Copy size={16}/> Copiar</button><a className="btn btn-primary" href={businessUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Abrir página</a></div></div>
      <div className="notice" style={{marginTop:12}}>{businessUrl}</div>
    </section>

    <div className="panel-grid" style={{marginTop:18}}>
      <section className="panel">
        <div className="row space"><div><h2>Profesionales</h2><p className="muted">El plan admite hasta 5 agendas activas.</p></div><Users size={22}/></div>
        <div style={{display:'grid',gap:8,marginTop:12}}>{data.team.map((m:Member)=><button key={m.id} className={'card '+(current?.id===m.id?'active':'')} style={{textAlign:'left',cursor:'pointer'}} onClick={()=>setSelected(m.id)}>
          <strong>{m.name}</strong>{m.isOwner&&<span className="pill" style={{marginLeft:8}}>Propietario</span>}
          <div className="muted" style={{fontSize:12,marginTop:4}}>{m.activity} · {m.category}</div>
          <div className="muted" style={{fontSize:12}}>{m.services.filter(s=>s.active).length} servicios · {m.availability.length} bloques</div>
        </button>)}</div>
      </section>

      <section className="panel">
        <h2>Agregar profesional</h2>
        <div className="form">
          <div className="field"><label>Nombre</label><input value={member.name} onChange={e=>setMember({...member,name:e.target.value})} placeholder="Nombre del profesional"/></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:160}}><label>Rubro</label><input value={member.category} onChange={e=>setMember({...member,category:e.target.value})} placeholder="Belleza"/></div><div className="field" style={{flex:1,minWidth:160}}><label>Actividad</label><input value={member.activity} onChange={e=>setMember({...member,activity:e.target.value})} placeholder="Barbero"/></div></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:160}}><label>Teléfono</label><input value={member.phone} onChange={e=>setMember({...member,phone:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:160}}><label>Correo (opcional)</label><input type="email" value={member.email} onChange={e=>setMember({...member,email:e.target.value})}/></div></div>
          <button className="btn btn-primary" disabled={data.team.length>=data.maxProfessionals} onClick={addMember}><Plus size={16}/> Agregar al equipo</button>
        </div>
      </section>
    </div>

    {current&&<>
      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div><span className="eyebrow">AGENDA SELECCIONADA</span><h2 style={{marginTop:8}}>{current.name} · {current.activity}</h2><p className="muted">Configura servicios y disponibilidad de esta persona.</p></div>
          <div className="button-row"><button className="btn btn-secondary" onClick={()=>copy(location.origin+'/reservar/'+current.slug)}><Copy size={16}/> Copiar reserva</button>{!current.isOwner&&<button className="btn btn-secondary" onClick={()=>action({action:'remove_member',doctorId:current.id})}><Trash2 size={16}/> Desactivar</button>}</div>
        </div>
      </section>

      <div className="panel-grid" style={{marginTop:18}}>
        <section className="panel">
          <h2>Servicios de {current.name}</h2>
          <div style={{display:'grid',gap:8,marginTop:12}}>{current.services.map(s=><div className="card" key={s.id}><div className="row space"><div><strong>{s.name}</strong><div className="muted" style={{fontSize:12}}>{s.durationMinutes} min</div></div><strong>{s.currency} {s.price}</strong></div><button className="btn btn-secondary" style={{marginTop:9}} onClick={()=>action({action:'update_service',doctorId:current.id,serviceId:s.id,active:!s.active})}>{s.active?'Pausar':'Activar'}</button></div>)}</div>
          <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'18px 0'}}/>
          <div className="form">
            <h3>Nuevo servicio</h3>
            <div className="field"><label>Nombre</label><input value={service.name} onChange={e=>setService({...service,name:e.target.value})} placeholder="Ej. Corte + barba"/></div>
            <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:120}}><label>Duración</label><input type="number" min={5} value={service.durationMinutes} onChange={e=>setService({...service,durationMinutes:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:120}}><label>Precio</label><input type="number" min={0} step="0.01" value={service.price} onChange={e=>setService({...service,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:100}}><label>Moneda</label><select value={service.currency} onChange={e=>setService({...service,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>
            <button className="btn btn-primary" onClick={addService}><BriefcaseBusiness size={16}/> Agregar servicio</button>
          </div>
        </section>

        <section className="panel">
          <h2>Disponibilidad de {current.name}</h2>
          <div style={{display:'grid',gap:8,marginTop:12}}>{current.availability.map(a=><div className="card" key={a.id}><strong>{new Date(a.startsAt).toLocaleDateString('es-VE',{weekday:'long',day:'2-digit',month:'short',timeZone:'America/Caracas'})}</strong><div className="muted">{new Date(a.startsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})} – {new Date(a.endsAt).toLocaleTimeString('es-VE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'})}</div><button className="btn btn-secondary" style={{marginTop:9}} onClick={()=>action({action:'delete_availability',doctorId:current.id,availabilityId:a.id})}><Trash2 size={15}/> Eliminar</button></div>)}</div>
          <hr style={{border:0,borderTop:'1px solid var(--line)',margin:'18px 0'}}/>
          <div className="form">
            <h3>Agregar horario</h3>
            <div className="field"><label>Fecha</label><input type="date" value={av.date} onChange={e=>setAv({...av,date:e.target.value})}/></div>
            <div className="row" style={{gap:10,alignItems:'stretch'}}><div className="field" style={{flex:1}}><label>Desde</label><input type="time" value={av.start} onChange={e=>setAv({...av,start:e.target.value})}/></div><div className="field" style={{flex:1}}><label>Hasta</label><input type="time" value={av.end} onChange={e=>setAv({...av,end:e.target.value})}/></div></div>
            <div className="field"><label>Inicio cada</label><select value={av.slotMinutes} onChange={e=>setAv({...av,slotMinutes:Number(e.target.value)})}><option value={10}>10 min</option><option value={15}>15 min</option><option value={20}>20 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option></select></div>
            <button className="btn btn-primary" onClick={addAvailability}><CalendarPlus size={16}/> Publicar horario</button>
          </div>
        </section>
      </div>
    </>}
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
