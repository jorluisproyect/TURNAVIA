'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { ArrowLeft, Building2, CheckCircle2, Clock3, DollarSign, Eye, HeartPulse, Plus, RefreshCw, ShieldCheck, Sparkles, UserRound } from 'lucide-react';

type Business={id:string,name:string,category:string,activity:string,type:string,status:'TRIAL'|'ACTIVO'|'SUSPENDIDO',trialEnds:string,services:{name:string,price:number,duration:number}[]};
type Appointment={id:string,businessId:string,client:string,email:string,service:string,date:string,time:string,amount:number,payment:string,reference:string,proof:string,status:'PAYMENT_REVIEW'|'CONFIRMED'|'REJECTED'|'COMPLETED'};

const seedBusinesses:Business[]=[
 {id:'med-1',name:'Dra. Sofía Mendoza',category:'Salud',activity:'Cardiología',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',services:[{name:'Consulta cardiológica',price:30,duration:30},{name:'Control',price:20,duration:20}]},
 {id:'bar-1',name:'Barber Studio 21',category:'Belleza',activity:'Barbería',type:'Negocio / local',status:'ACTIVO',trialEnds:'',services:[{name:'Corte clásico',price:12,duration:30},{name:'Corte + barba',price:18,duration:45}]},
 {id:'spa-1',name:'Aura Spa',category:'Bienestar',activity:'Spa',type:'Negocio / local',status:'ACTIVO',trialEnds:'',services:[{name:'Masaje relajante',price:35,duration:60},{name:'Spa facial',price:25,duration:45}]},
 {id:'nail-1',name:'Luna Nails',category:'Belleza',activity:'Manicurista',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-23',services:[{name:'Semipermanente',price:15,duration:60},{name:'Acrílicas',price:25,duration:90}]},
 {id:'pro-1',name:'G&M Consultores',category:'Servicios profesionales',activity:'Contabilidad',type:'Negocio / local',status:'ACTIVO',trialEnds:'',services:[{name:'Asesoría tributaria',price:30,duration:45},{name:'Consulta contable',price:25,duration:45}]},
 {id:'auto-1',name:'Detail Pro',category:'Automotriz',activity:'Detailing',type:'Negocio / local',status:'ACTIVO',trialEnds:'',services:[{name:'Lavado premium',price:20,duration:60},{name:'Detailing completo',price:60,duration:180}]},
 {id:'pet-1',name:'Huellas Grooming',category:'Mascotas',activity:'Grooming',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-23',services:[{name:'Baño y corte',price:20,duration:60},{name:'Corte de uñas',price:8,duration:20}]},
 {id:'adult-1',name:'Reserva Privada',category:'Servicios 18+',activity:'Servicio privado con reserva',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-23',services:[{name:'Reserva privada',price:40,duration:60}]}
];

const seedAppointments:Appointment[]=[
 {id:'apt-1',businessId:'med-1',client:'María González',email:'maria@example.com',service:'Consulta cardiológica',date:'2026-09-19',time:'09:00',amount:30,payment:'Pago móvil',reference:'458921',proof:'capture_demo.jpg',status:'CONFIRMED'},
 {id:'apt-2',businessId:'bar-1',client:'Carlos Rojas',email:'carlos@example.com',service:'Corte + barba',date:'2026-09-19',time:'11:30',amount:18,payment:'Binance',reference:'BNC-88921',proof:'binance_demo.png',status:'PAYMENT_REVIEW'},
 {id:'apt-3',businessId:'spa-1',client:'Ana Torres',email:'ana@example.com',service:'Masaje relajante',date:'2026-09-20',time:'15:00',amount:35,payment:'PayPal',reference:'PP-21098',proof:'paypal_demo.png',status:'PAYMENT_REVIEW'}
];

const slots=['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
const categories=['Salud','Belleza','Bienestar','Servicios profesionales','Educación','Automotriz','Hogar y técnicos','Mascotas','Deporte','Espacios y alquiler','Eventos','Servicios 18+','Otro'];

export default function Demo(){
 const [view,setView]=useState<'home'|'master'|'professional'|'client'>('home');
 const [businesses,setBusinesses]=useState<Business[]>(seedBusinesses);
 const [appointments,setAppointments]=useState<Appointment[]>(seedAppointments);
 const [selectedBusiness,setSelectedBusiness]=useState('med-1');
 const [selectedService,setSelectedService]=useState('');
 const [date,setDate]=useState('2026-09-20');
 const [time,setTime]=useState('09:00');
 const [client,setClient]=useState('');
 const [email,setEmail]=useState('');
 const [payment,setPayment]=useState('PayPal');
 const [reference,setReference]=useState('');
 const [proof,setProof]=useState('');
 const [msg,setMsg]=useState('');
 const [showCreate,setShowCreate]=useState(false);
 const [newBiz,setNewBiz]=useState({name:'',category:'Belleza',activity:'Barbería',type:'Profesional independiente'});

 useEffect(()=>{
  try{
   const b=localStorage.getItem('turnavia-demo-businesses');
   const a=localStorage.getItem('turnavia-demo-appointments');
   if(b)setBusinesses(JSON.parse(b));
   if(a)setAppointments(JSON.parse(a));
  }catch{}
 },[]);
 useEffect(()=>{try{localStorage.setItem('turnavia-demo-businesses',JSON.stringify(businesses))}catch{}},[businesses]);
 useEffect(()=>{try{localStorage.setItem('turnavia-demo-appointments',JSON.stringify(appointments))}catch{}},[appointments]);

 const biz=useMemo(()=>businesses.find(b=>b.id===selectedBusiness)||businesses[0],[businesses,selectedBusiness]);
 const service=useMemo(()=>biz?.services.find(s=>s.name===selectedService)||biz?.services[0],[biz,selectedService]);
 const bizAppointments=useMemo(()=>appointments.filter(a=>a.businessId===biz?.id),[appointments,biz]);

 function reset(){
  setBusinesses(seedBusinesses);setAppointments(seedAppointments);setSelectedBusiness('med-1');setSelectedService('');setMsg('Demo reiniciada.');
  try{localStorage.removeItem('turnavia-demo-businesses');localStorage.removeItem('turnavia-demo-appointments')}catch{}
 }
 function changeAppointment(id:string,status:Appointment['status']){
  setAppointments(v=>v.map(a=>a.id===id?{...a,status}:a));
 }
 function book(){
  if(!client.trim()||!email.trim()||!reference.trim()){setMsg('Completa nombre, correo y referencia de pago.');return}
  const s=service||biz.services[0];
  const a:Appointment={id:'apt-'+Date.now(),businessId:biz.id,client:client.trim(),email:email.trim(),service:s.name,date,time,amount:s.price,payment,reference:reference.trim(),proof:proof||'comprobante_demo.png',status:'PAYMENT_REVIEW'};
  setAppointments(v=>[a,...v]);setMsg('Reserva creada. El pago quedó en revisión y ya aparece en el panel del profesional.');
 }
 function createBusiness(){
  if(!newBiz.name.trim()){setMsg('Escribe el nombre del negocio o profesional.');return}
  const id='biz-'+Date.now();
  const end=new Date(Date.now()+5*86400000).toISOString().slice(0,10);
  const b:Business={id,name:newBiz.name.trim(),category:newBiz.category,activity:newBiz.activity||'Otro',type:newBiz.type,status:'TRIAL',trialEnds:end,services:[{name:'Servicio inicial',price:20,duration:30}]};
  setBusinesses(v=>[b,...v]);setSelectedBusiness(id);setShowCreate(false);setMsg('Nueva prueba creada con 5 días gratis.');
 }
 const statusLabel=(s:string)=>({TRIAL:'Prueba 5 días',ACTIVO:'Activo',SUSPENDIDO:'Suspendido',PAYMENT_REVIEW:'Pago en revisión',CONFIRMED:'Confirmada',REJECTED:'Pago rechazado',COMPLETED:'Completada'} as any)[s]||s;
 const tone=(s:string)=>['ACTIVO','CONFIRMED','COMPLETED'].includes(s)?'ok':['SUSPENDIDO','REJECTED'].includes(s)?'bad':'warn';

 return <main className="demo-chooser">
  <div className="container" style={{paddingTop:28,paddingBottom:50}}>
   <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
    <Brand/>
    <div className="row" style={{gap:8,flexWrap:'wrap'}}>
      {view!=='home'&&<button className="btn btn-secondary" onClick={()=>setView('home')}><ArrowLeft size={16}/> Demo</button>}
      <button className="btn btn-secondary" onClick={reset}><RefreshCw size={16}/> Reiniciar</button>
      <Link href="/" className="btn btn-secondary">Inicio real</Link>
    </div>
   </div>

   {msg&&<div className="notice" style={{marginTop:18}}>{msg}</div>}

   {view==='home'&&<>
    <div className="demo-head">
      <span className="eyebrow"><Sparkles size={15}/> DEMO COMERCIAL MULTIRRUBRO</span>
      <h1>TURNAVIA organiza cualquier negocio que trabaje por cita.</h1>
      <p className="muted">Una sola plataforma para salud, barbería, spa, uñas, servicios profesionales, automotriz, mascotas y muchos otros rubros. Todo lo que hagas aquí se refleja entre los módulos del demo.</p>
    </div>
    <div className="stat-grid">
      <div className="stat"><Building2 size={18}/><small>Negocios demo</small><div className="n">{businesses.length}</div></div>
      <div className="stat"><Clock3 size={18}/><small>Reservas</small><div className="n">{appointments.length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Activos</small><div className="n">{businesses.filter(b=>b.status==='ACTIVO').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>En revisión</small><div className="n">{appointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
    </div>
    <div className="role-grid" style={{marginTop:20}}>
      <button className="role-card" onClick={()=>setView('master')}><div className="iconbox"><ShieldCheck/></div><h3>Master</h3><p>Clientes, pruebas, activaciones y control comercial.</p><div className="go">Entrar al Master</div></button>
      <button className="role-card" onClick={()=>setView('professional')}><div className="iconbox"><HeartPulse/></div><h3>Profesional / Negocio</h3><p>Agenda, pagos y atención diaria del negocio.</p><div className="go">Entrar al panel</div></button>
      <button className="role-card" onClick={()=>setView('client')}><div className="iconbox"><UserRound/></div><h3>Cliente</h3><p>Elige servicio, horario, paga y reserva.</p><div className="go">Reservar ahora</div></button>
    </div>
    <section className="panel" style={{marginTop:20}}>
      <h2>Rubros disponibles</h2>
      <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:12}}>{categories.map(c=><span className="pill" key={c}>{c}</span>)}</div>
      <div className="notice" style={{marginTop:14}}>Servicios 18+ se muestra de forma discreta y está limitado a mayores de edad y actividades permitidas por la legislación aplicable.</div>
    </section>
   </>}

   {view==='master'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Administración comercial</div><h1>Panel Master · Demo</h1></div><button className="btn btn-primary" onClick={()=>setShowCreate(v=>!v)}><Plus size={16}/> Nueva prueba</button></div>
    {showCreate&&<section className="panel" style={{marginBottom:18}}>
      <h2>Crear negocio de prueba</h2>
      <div className="form">
       <div className="field"><label>Nombre</label><input value={newBiz.name} onChange={e=>setNewBiz({...newBiz,name:e.target.value})} placeholder="Ej. Barbería Central"/></div>
       <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Rubro</label><select value={newBiz.category} onChange={e=>setNewBiz({...newBiz,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Actividad</label><input value={newBiz.activity} onChange={e=>setNewBiz({...newBiz,activity:e.target.value})} placeholder="Barbería / Spa / Contabilidad"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tipo</label><select value={newBiz.type} onChange={e=>setNewBiz({...newBiz,type:e.target.value})}><option>Profesional independiente</option><option>Negocio / local</option></select></div>
       </div>
       <button className="btn btn-primary" onClick={createBusiness}>Crear 5 días gratis</button>
      </div>
    </section>}
    <div className="stat-grid">
      <div className="stat"><Building2 size={18}/><small>Total clientes</small><div className="n">{businesses.length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Activos</small><div className="n">{businesses.filter(b=>b.status==='ACTIVO').length}</div></div>
      <div className="stat"><Clock3 size={18}/><small>Pruebas</small><div className="n">{businesses.filter(b=>b.status==='TRIAL').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>MRR demo</small><div className="n">{'</div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">{'</div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}>{'</td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · {'</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">{'</div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity}</div></td><td>{b.category}</td><td>{b.type}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Ver negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>
    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Citas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">$${bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}> $${a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva una cita</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}</div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · $${s.price} · {s.duration} min</option>)}</select></div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora</label><select value={time} onChange={e=>setTime(e.target.value)}>{slots.map(s=><option key={s}>{s}</option>)}</select></div>
       </div>
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">$${service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>
    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,6).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}
  </div>
 </main>
}
