'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { CalendarPlus, Copy, Plus, Trash2, Users, BriefcaseBusiness, ExternalLink, Eye, ImagePlus, Pencil, UserRound, MapPin } from 'lucide-react';
import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

type Member={
  id:string;name:string;email:string;phone:string;slug:string;category:string;activity:string;isOwner:boolean;
  profileImage:string;about:string;licenseNumber:string;employeeStatus:string;acceptsOnlineBooking:boolean;
  location:{id:string;name:string;address:string;city:string;state:string;country:string};
  services:{id:string;name:string;description:string;durationMinutes:number;price:number;currency:string;active:boolean}[];
  availability:{id:string;startsAt:string;endsAt:string;slotMinutes:number;published:boolean}[];
  appointments:{id:string;startsAt:string;endsAt:string;status:string;serviceName:string;price:number;currency:string;paymentMethod:string;paymentReference:string;paymentProofUrl:string;clientName:string;clientPhone:string;clientEmail:string}[];
};

function splitPhone(value:string){
  const v=String(value||'').trim();
  const found=[...COUNTRY_PHONE_CODES].sort((a,b)=>b.code.length-a.code.length).find(x=>v.startsWith(x.code));
  return found?{code:found.code,local:v.slice(found.code.length).trim()}:{code:'+58',local:v};
}
function fullPhone(code:string,local:string){return (code+' '+String(local||'').replace(/^0+/,'').trim()).trim()}
async function resizeAvatar(file:File){
  if(file.size>5_000_000)throw new Error('La imagen supera 5 MB.');
  const src=URL.createObjectURL(file);
  try{
    const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=src});
    const size=256,ratio=Math.max(size/img.width,size/img.height),sw=size/ratio,sh=size/ratio,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    canvas.getContext('2d')?.drawImage(img,sx,sy,sw,sh,0,0,size,size);
    return canvas.toDataURL('image/webp',.75);
  }finally{URL.revokeObjectURL(src)}
}
const statusText:any={AVAILABLE:'Disponible',BREAK:'Descanso',VACATION:'Vacaciones',INACTIVE:'Inactivo'};

export default function EquipoPage(){
  const [data,setData]=useState<any>(null);
  const [selected,setSelected]=useState('');
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [member,setMember]=useState({name:'',activity:'',category:'',phoneCode:'+58',phoneLocal:'',email:'',profileImage:'',about:'',licenseNumber:'',employeeStatus:'AVAILABLE',locationId:''});
  const [editMember,setEditMember]=useState<any>(null);
  const [service,setService]=useState({name:'',description:'',durationMinutes:30,price:0,currency:'USD'});
  const [av,setAv]=useState({date:'',start:'09:00',end:'17:00',slotMinutes:15});
  const [fx,setFx]=useState<any>(null);

  async function load(){
    try{
      const r=await fetch('/api/me/team');
      const j=await r.json();
      if(!r.ok){setError(j.error||'No se pudo abrir el equipo');return}
      setData(j);setError('');
      if(j.team?.length&&!selected)setSelected(j.team[0].id);
    }catch{setError('No se pudo conectar con TUCITA.')}
  }
  useEffect(()=>{load();fetch('/api/fx').then(r=>r.json()).then(setFx).catch(()=>{})},[]);
  const current:Member|undefined=useMemo(()=>data?.team?.find((m:Member)=>m.id===selected)||data?.team?.[0],[data,selected]);

  async function action(body:any){
    const r=await fetch('/api/me/team',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||'No se pudo guardar');return false}
    setMsg('Cambios guardados');await load();setTimeout(()=>setMsg(''),1800);return true;
  }

  async function addMember(){
    const ok=await action({action:'add_member',...member,phone:fullPhone(member.phoneCode,member.phoneLocal)});
    if(ok)setMember({name:'',activity:'',category:'',phoneCode:'+58',phoneLocal:'',email:'',profileImage:'',about:'',licenseNumber:'',employeeStatus:'AVAILABLE',locationId:''});
  }
  async function addMemberPhoto(file?:File){
    if(!file)return;
    try{const img=await resizeAvatar(file);setMember(x=>({...x,profileImage:img}))}catch(e:any){setMsg(e?.message||'No se pudo procesar la foto.')}
  }
  function openEditMember(m:Member){
    const ph=splitPhone(m.phone);
    setEditMember({...m,phoneCode:ph.code,phoneLocal:ph.local,locationId:m.location?.id||''});
  }
  async function editMemberPhoto(file?:File){
    if(!file)return;
    try{const img=await resizeAvatar(file);setEditMember((x:any)=>({...x,profileImage:img}))}catch(e:any){setMsg(e?.message||'No se pudo procesar la foto.')}
  }
  async function saveMember(){
    if(!editMember)return;
    const ok=await action({action:'update_member',doctorId:editMember.id,name:editMember.name,category:editMember.category,activity:editMember.activity,phone:fullPhone(editMember.phoneCode,editMember.phoneLocal),profileImage:editMember.profileImage,about:editMember.about,licenseNumber:editMember.licenseNumber,employeeStatus:editMember.employeeStatus,locationId:editMember.locationId});
    if(ok)setEditMember(null);
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
  function convert(amount:number,from:string,to:string){
    const rates=fx?.rates||{};const f=Number(rates[from]),t=Number(rates[to]);if(!(f>0)||!(t>0))return null;return Number(amount||0)/f*t;
  }
  function pricePreview(){
    if(!fx?.available||!service.price)return null;
    return <div className="fx-strip">{['USD','EUR','USDT','VES'].map(cur=>{const v=convert(service.price,service.currency,cur);return <div className="fx-chip" key={cur}><small>{cur}</small><strong>{v===null?'—':new Intl.NumberFormat('es-VE',{maximumFractionDigits:2}).format(v)+' '+cur}</strong></div>})}</div>;
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
          <div className="row" style={{gap:12,alignItems:'center'}}>{m.profileImage?<img src={m.profileImage} alt="" style={{width:54,height:54,borderRadius:16,objectFit:'cover',flex:'0 0 auto'}}/>:<div className="profile-avatar" style={{width:54,height:54,borderRadius:16,flex:'0 0 auto'}}><UserRound size={22}/></div>}<div style={{minWidth:0}}><strong>{m.name}</strong>{m.isOwner&&<span className="pill" style={{marginLeft:8}}>Propietario</span>}<div className="muted" style={{fontSize:12,marginTop:4}}>{m.activity} · {m.category}</div></div></div>
          <div className="row space" style={{marginTop:10,gap:8,flexWrap:'wrap'}}><span className={'status '+(m.employeeStatus==='AVAILABLE'?'ok':m.employeeStatus==='INACTIVE'?'bad':'warn')}>{statusText[m.employeeStatus]||'Disponible'}</span><span className="muted" style={{fontSize:12}}>{m.services.filter(s=>s.active).length} servicios · {m.availability.length} bloques</span></div>
        </button>)}</div>
      </section>

      <section className="panel">
        <h2>Agregar profesional</h2>
        <div className="form">
          <div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>{member.profileImage?<img src={member.profileImage} alt="Foto" style={{width:72,height:72,borderRadius:20,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:72,height:72}}><UserRound size={28}/></div>}<label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> {member.profileImage?'Cambiar foto':'Foto'}<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>addMemberPhoto(e.target.files?.[0])}/></label></div>
          <div className="field"><label>Nombre</label><input value={member.name} onChange={e=>setMember({...member,name:e.target.value})} placeholder="Nombre del profesional"/></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:160}}><label>Rubro</label><input value={member.category} onChange={e=>setMember({...member,category:e.target.value})} placeholder="Belleza"/></div><div className="field" style={{flex:1,minWidth:160}}><label>Profesión / actividad</label><input value={member.activity} onChange={e=>setMember({...member,activity:e.target.value})} placeholder="Barbero"/></div></div>
          <div className="field"><label>Presentación breve</label><textarea rows={3} maxLength={420} value={member.about} onChange={e=>setMember({...member,about:e.target.value})} placeholder="Ej. Especialista en cortes modernos y barba. 6 años de experiencia."/></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>País / código</label><select value={member.phoneCode} onChange={e=>setMember({...member,phoneCode:e.target.value})}>{COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.code}>{x.country} {x.code}</option>)}</select></div><div className="field" style={{flex:1,minWidth:180}}><label>Teléfono</label><input value={member.phoneLocal} onChange={e=>setMember({...member,phoneLocal:e.target.value})} placeholder="Número sin código"/></div></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Correo (opcional)</label><input type="email" value={member.email} onChange={e=>setMember({...member,email:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>Licencia / colegiatura (opcional)</label><input value={member.licenseNumber} onChange={e=>setMember({...member,licenseNumber:e.target.value})} placeholder="Solo cuando aplique"/></div></div>
          <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Sede</label><select value={member.locationId} onChange={e=>setMember({...member,locationId:e.target.value})}><option value="">Sede principal</option>{(data.locations||[]).map((l:any)=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div><div className="field" style={{flex:1,minWidth:180}}><label>Estado</label><select value={member.employeeStatus} onChange={e=>setMember({...member,employeeStatus:e.target.value})}><option value="AVAILABLE">Disponible</option><option value="BREAK">Descanso</option><option value="VACATION">Vacaciones</option><option value="INACTIVE">Inactivo</option></select></div></div>
          <button className="btn btn-primary" disabled={data.team.length>=data.maxProfessionals} onClick={addMember}><Plus size={16}/> Agregar al equipo</button>
        </div>
      </section>
    </div>

    {current&&<>
      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
          <div className="row" style={{gap:14,alignItems:'center'}}>{current.profileImage?<img src={current.profileImage} alt="" style={{width:68,height:68,borderRadius:20,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:68,height:68}}><UserRound size={26}/></div>}<div><span className="eyebrow">AGENDA SELECCIONADA</span><h2 style={{marginTop:8,marginBottom:4}}>{current.name} · {current.activity}</h2><div className="row muted" style={{fontSize:12,gap:6}}><MapPin size={13}/>{current.location?.name||'Sede por asignar'} · {statusText[current.employeeStatus]||'Disponible'}</div>{current.about&&<p className="muted" style={{marginBottom:0,maxWidth:620}}>{current.about}</p>}</div></div>
          <div className="button-row"><button className="btn btn-secondary" onClick={()=>openEditMember(current)}><Pencil size={16}/> Editar ficha</button><button className="btn btn-secondary" onClick={()=>copy(location.origin+'/reservar/'+current.slug)}><Copy size={16}/> Copiar reserva</button>{!current.isOwner&&<button className="btn btn-secondary" onClick={()=>action({action:'remove_member',doctorId:current.id})}><Trash2 size={16}/> Desactivar</button>}</div>
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
            <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:120}}><label>Duración</label><input type="number" min={5} value={service.durationMinutes} onChange={e=>setService({...service,durationMinutes:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:120}}><label>Precio</label><input type="number" min={0} step="0.01" value={service.price} onChange={e=>setService({...service,price:Number(e.target.value)})}/></div><div className="field" style={{flex:1,minWidth:100}}><label>Moneda</label><select value={service.currency} onChange={e=>setService({...service,currency:e.target.value})}><option>USD</option><option>EUR</option><option>VES</option><option>USDT</option></select></div></div>{pricePreview()}
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

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Reservas de {current.name}</h2><p className="muted">El propietario puede revisar pagos y operar la agenda de cada integrante del equipo.</p></div><span className="pill">{current.appointments?.length||0} reservas</span></div>
        {!current.appointments?.length?<div className="notice" style={{marginTop:12}}>Este profesional todavía no tiene reservas próximas.</div>:<div style={{overflowX:'auto',marginTop:12}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{current.appointments.map(a=><tr key={a.id}>
          <td><strong>{a.clientName}</strong><div className="muted" style={{fontSize:12}}>{a.clientPhone} · {a.clientEmail}</div></td>
          <td>{a.serviceName}<div className="muted" style={{fontSize:12}}>{a.currency} {a.price}</div></td>
          <td>{new Date(a.startsAt).toLocaleString('es-VE',{dateStyle:'short',timeStyle:'short',timeZone:'America/Caracas'})}</td>
          <td>{a.paymentMethod||'—'}{a.paymentReference&&<div><strong>Ref: {a.paymentReference}</strong></div>}{a.paymentProofUrl&&<a href={a.paymentProofUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{padding:'6px 8px',marginTop:5}}><Eye size={14}/> Ver</a>}</td>
          <td><span className={'status '+(a.status==='PAYMENT_REVIEW'?'warn':['CONFIRMED','ARRIVED','IN_CONSULTATION','COMPLETED'].includes(a.status)?'ok':a.status==='PAYMENT_REJECTED'?'bad':'')}>{a.status==='PAYMENT_REVIEW'?'Pago en revisión':a.status==='PAYMENT_REJECTED'?'Pago rechazado':a.status==='CONFIRMED'?'Confirmada':a.status==='ARRIVED'?'Llegó':a.status==='IN_CONSULTATION'?'En atención':a.status==='COMPLETED'?'Completada':a.status}</span></td>
          <td><div className="row" style={{gap:6,flexWrap:'wrap'}}>
            {a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>action({action:'approve_payment',doctorId:current.id,appointmentId:a.id})}>Aprobar</button><button className="btn btn-secondary" onClick={()=>action({action:'reject_payment',doctorId:current.id,appointmentId:a.id})}>Rechazar</button></>}
            {a.status==='CONFIRMED'&&<button className="btn btn-secondary" onClick={()=>action({action:'appointment_status',doctorId:current.id,appointmentId:a.id,status:'ARRIVED'})}>Llegó</button>}
            {a.status==='ARRIVED'&&<button className="btn btn-secondary" onClick={()=>action({action:'appointment_status',doctorId:current.id,appointmentId:a.id,status:'IN_CONSULTATION'})}>Atender</button>}
            {a.status==='IN_CONSULTATION'&&<button className="btn btn-primary" onClick={()=>action({action:'appointment_status',doctorId:current.id,appointmentId:a.id,status:'COMPLETED'})}>Completar</button>}
          </div></td>
        </tr>)}</tbody></table></div>}
      </section>
    </>}
    {editMember&&<div className="modal-backdrop"><div className="modal profile-modal"><div className="profile-modal-scroll"><h2>Editar ficha de equipo</h2><div className="form">
      <div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>{editMember.profileImage?<img src={editMember.profileImage} alt="" style={{width:82,height:82,borderRadius:22,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:82,height:82}}><UserRound size={30}/></div>}<label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> Cambiar foto<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>editMemberPhoto(e.target.files?.[0])}/></label>{editMember.profileImage&&<button className="btn btn-secondary" type="button" onClick={()=>setEditMember({...editMember,profileImage:''})}><Trash2 size={15}/> Quitar</button>}</div>
      <div className="field"><label>Nombre visible</label><input value={editMember.name||''} onChange={e=>setEditMember({...editMember,name:e.target.value})}/></div>
      <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Rubro</label><input value={editMember.category||''} onChange={e=>setEditMember({...editMember,category:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>Profesión / actividad</label><input value={editMember.activity||''} onChange={e=>setEditMember({...editMember,activity:e.target.value})}/></div></div>
      <div className="field"><label>Presentación breve</label><textarea rows={3} maxLength={420} value={editMember.about||''} onChange={e=>setEditMember({...editMember,about:e.target.value})}/></div>
      <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>País / código</label><select value={editMember.phoneCode||'+58'} onChange={e=>setEditMember({...editMember,phoneCode:e.target.value})}>{COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.code}>{x.country} {x.code}</option>)}</select></div><div className="field" style={{flex:1,minWidth:180}}><label>Teléfono</label><input value={editMember.phoneLocal||''} onChange={e=>setEditMember({...editMember,phoneLocal:e.target.value})}/></div></div>
      <div className="row" style={{gap:10,alignItems:'stretch',flexWrap:'wrap'}}><div className="field" style={{flex:1,minWidth:180}}><label>Licencia / colegiatura</label><input value={editMember.licenseNumber||''} onChange={e=>setEditMember({...editMember,licenseNumber:e.target.value})}/></div><div className="field" style={{flex:1,minWidth:180}}><label>Sede</label><select value={editMember.locationId||''} onChange={e=>setEditMember({...editMember,locationId:e.target.value})}><option value="">Sin cambiar</option>{(data.locations||[]).map((l:any)=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div></div>
      <div className="field"><label>Estado</label><select value={editMember.employeeStatus||'AVAILABLE'} onChange={e=>setEditMember({...editMember,employeeStatus:e.target.value})}><option value="AVAILABLE">Disponible</option><option value="BREAK">Descanso</option><option value="VACATION">Vacaciones</option><option value="INACTIVE">Inactivo</option></select></div>
    </div></div><div className="button-row profile-modal-actions"><button className="btn btn-primary" onClick={saveMember}>Guardar ficha</button><button className="btn btn-secondary" onClick={()=>setEditMember(null)}>Cancelar</button></div></div></div>}
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
