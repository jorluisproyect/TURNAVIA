'use client';

import { useEffect,useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { BriefcaseBusiness, LayoutGrid, List, PauseCircle, PlayCircle } from 'lucide-react';

export default function ServiciosProfesional(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [view,setView]=useState<'cards'|'list'>('cards');
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');

  const load=()=>fetch('/api/me/provider',{cache:'no-store'}).then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
    if(!ok){setError(j.error||'No se pudieron cargar tus servicios.');return}
    setData(j);setError('');
  }).catch(()=>setError('No se pudo conectar con TUCITA.'));

  useEffect(()=>{load()},[]);

  async function toggle(id:string,active:boolean){
    if(busy)return;
    setBusy(id);setMsg(active?'Pausando servicio…':'Activando servicio…');
    try{
      const r=await fetch('/api/me/provider',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'update_service',id,active:!active})});
      const j=await r.json();
      if(!r.ok){setMsg(j.error||'No se pudo actualizar el servicio.');return}
      setMsg(active?'Servicio pausado.':'Servicio activado.');await load();
    }catch{setMsg('No se pudo conectar con TUCITA.')}
    finally{setBusy('');setTimeout(()=>setMsg(''),2200)}
  }

  const services=data?.services||[];

  return <div className="dashboard"><Sidebar role="medico"/><main className="main">
    <div className="topbar">
      <div><div className="muted" style={{fontSize:13}}>Catálogo profesional</div><h1>Servicios</h1><div className="muted" style={{fontSize:13,marginTop:5}}>Aquí ves únicamente los servicios que ya creaste.</div></div>
      <Link href="/medico#servicios" className="btn btn-primary">Crear / editar servicio</Link>
    </div>

    <section className="panel">
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{services.length} servicio{services.length===1?'':'s'}</span><span className="pill">{services.filter((s:any)=>s.active).length} activo{services.filter((s:any)=>s.active).length===1?'':'s'}</span></div>
        <div className="master-view-toggle">
          <button type="button" className={view==='cards'?'active':''} onClick={()=>setView('cards')}><LayoutGrid size={14}/> Tarjetas</button>
          <button type="button" className={view==='list'?'active':''} onClick={()=>setView('list')}><List size={14}/> Lista</button>
        </div>
      </div>

      {error&&<div className="notice danger" style={{marginTop:14}}>{error}</div>}
      {!data&&!error&&<div className="notice" style={{marginTop:14}}>Cargando servicios…</div>}
      {data&&services.length===0&&<div className="notice" style={{marginTop:14}}>Todavía no tienes servicios creados.</div>}

      {data&&services.length>0&&view==='cards'&&<div className="professional-service-grid">
        {services.map((s:any)=><article className="professional-service-card" key={s.id}>
          {s.serviceImage?<img src={s.serviceImage} alt={s.name}/>:s.travelImage?<img src={s.travelImage} alt={s.name}/>:<div className="professional-service-placeholder"><BriefcaseBusiness size={24}/></div>}
          <div className="professional-service-body">
            <div className="row space" style={{gap:8,alignItems:'flex-start'}}><div><h3>{s.name}</h3><div className="muted" style={{fontSize:12}}>{s.durationMinutes} min</div></div><span className={s.active?'status ok':'status'}>{s.active?'Activo':'Pausado'}</span></div>
            <p>{s.summary||s.description||'Sin descripción'}</p>
            <div className="row space" style={{gap:10,flexWrap:'wrap'}}><strong>{s.currency} {Number(s.price||0).toFixed(2)}</strong><button className="btn btn-secondary" onClick={()=>toggle(String(s.id),Boolean(s.active))} disabled={busy===String(s.id)}>{s.active?<PauseCircle size={15}/>:<PlayCircle size={15}/>} {busy===String(s.id)?'Procesando…':s.active?'Pausar':'Activar'}</button></div>
          </div>
        </article>)}
      </div>}

      {data&&services.length>0&&view==='list'&&<div className="professional-service-list">
        {services.map((s:any)=><article className="professional-service-row" key={s.id}>
          <div className="professional-service-mini">{s.serviceImage?<img src={s.serviceImage} alt=""/>:s.travelImage?<img src={s.travelImage} alt=""/>:<BriefcaseBusiness size={18}/>}</div>
          <div className="professional-service-copy"><strong>{s.name}</strong><span>{s.durationMinutes} min · {s.currency} {Number(s.price||0).toFixed(2)}</span></div>
          <span className={s.active?'status ok':'status'}>{s.active?'Activo':'Pausado'}</span>
          <button className="btn btn-secondary" onClick={()=>toggle(String(s.id),Boolean(s.active))} disabled={busy===String(s.id)}>{s.active?<PauseCircle size={15}/>:<PlayCircle size={15}/>} {busy===String(s.id)?'Procesando…':s.active?'Pausar':'Activar'}</button>
        </article>)}
      </div>}
    </section>
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
