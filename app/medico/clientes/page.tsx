'use client';
import { useEffect,useMemo,useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { providerAudienceLabel } from '@/lib/provider-labels';
import { CalendarCheck2,Mail,Phone,Search,Users } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';

export default function ProviderClientsPage(){
  const [data,setData]=useState<any>(null);
  const [q,setQ]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    fetch('/api/me/provider').then(async r=>({ok:r.ok,j:await r.json()})).then(({ok,j})=>{
      if(!ok){setError(j.error||'No se pudo cargar');return}
      setData(j);
    }).catch(()=>setError('No se pudo conectar con TUCITA.'));
  },[]);

  const audience=data?providerAudienceLabel(data.provider?.category,data.provider?.activity):'Clientes';
  const clients=useMemo(()=>{
    const map=new Map<string,any>();
    for(const a of data?.appointments||[]){
      const key=String(a.clientEmail||a.clientPhone||a.clientName||a.id).toLowerCase();
      const current=map.get(key)||{
        key,name:a.clientName,email:a.clientEmail||'',phone:a.clientPhone||'',
        total:0,completed:0,noShow:0,lastAt:a.startsAt,lastService:a.serviceName,lastStatus:a.status,lastLocation:a.location?.name||''
      };
      current.total++;
      if(a.status==='COMPLETED')current.completed++;
      if(a.status==='NO_SHOW')current.noShow++;
      if(new Date(a.startsAt).getTime()>new Date(current.lastAt).getTime()){
        current.lastAt=a.startsAt;current.lastService=a.serviceName;current.lastStatus=a.status;current.lastLocation=a.location?.name||'';
      }
      map.set(key,current);
    }
    return Array.from(map.values()).sort((a,b)=>new Date(b.lastAt).getTime()-new Date(a.lastAt).getTime());
  },[data]);

  const filtered=clients.filter((c:any)=>{
    const v=(c.name+' '+c.email+' '+c.phone).toLowerCase();
    return v.includes(q.toLowerCase());
  });

  if(error&&!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main"><section className="panel"><h1>{audience}</h1><div className="notice danger">{error}</div></section></main></div>;
  if(!data)return <div className="dashboard"><Sidebar role="medico"/><main className="main">Cargando…</main></div>;

  return <div className="dashboard"><Sidebar role="medico"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Relación y asistencia</div><h1>{audience}</h1></div><div className="row"><Search size={16}/><input className="small-input" placeholder={'Buscar '+audience.toLowerCase()} value={q} onChange={e=>setQ(e.target.value)}/></div></div>
    <div className="stat-grid">
      <div className="stat"><small>{audience} únicos</small><div className="n">{clients.length}</div></div>
      <div className="stat"><small>Servicios completados</small><div className="n">{clients.reduce((s:number,c:any)=>s+c.completed,0)}</div></div>
      <div className="stat"><small>Reservas registradas</small><div className="n">{clients.reduce((s:number,c:any)=>s+c.total,0)}</div></div>
      <div className="stat"><small>No asistencias</small><div className="n">{clients.reduce((s:number,c:any)=>s+c.noShow,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <div className="row space"><div><h2>Historial de {audience.toLowerCase()}</h2><div className="muted" style={{fontSize:13}}>Se alimenta automáticamente de las reservas de TUCITA.</div></div><Users size={22}/></div>
      {!filtered.length?<div className="empty" style={{marginTop:14}}>Todavía no hay {audience.toLowerCase()} registrados.</div>:
      <div style={{overflowX:'auto',marginTop:14}}><table className="table"><thead><tr><th>{audience.slice(0,-1)}</th><th>Contacto</th><th>Último servicio</th><th>Reservas</th><th>Completadas</th><th>Último estado</th></tr></thead><tbody>
        {filtered.map((c:any)=><tr key={c.key}>
          <td><strong>{c.name}</strong>{c.lastLocation&&<div className="muted" style={{fontSize:12}}>{c.lastLocation}</div>}</td>
          <td>{c.email&&<div className="row" style={{gap:6}}><Mail size={13}/>{c.email}</div>}{c.phone&&<div className="row" style={{gap:6,marginTop:4}}><Phone size={13}/>{c.phone}</div>}</td>
          <td><strong>{c.lastService}</strong><div className="muted" style={{fontSize:12}}><CalendarCheck2 size={12}/> {new Date(c.lastAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}</div></td>
          <td>{c.total}</td><td>{c.completed}</td>
          <td><StatusPill tone={c.lastStatus==='COMPLETED'?'ok':c.lastStatus==='NO_SHOW'?'bad':c.lastStatus==='PAYMENT_REVIEW'?'warn':''}>{c.lastStatus}</StatusPill></td>
        </tr>)}
      </tbody></table></div>}
    </section>
  </main></div>;
}
