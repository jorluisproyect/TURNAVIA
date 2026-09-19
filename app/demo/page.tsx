'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { ArrowLeft, Building2, CheckCircle2, Clock3, DollarSign, Eye, HeartPulse, Plus, RefreshCw, ShieldCheck, Sparkles, UserRound, MapPin, Users, CalendarDays, PlayCircle, ChevronLeft, ChevronRight, X, Lightbulb } from 'lucide-react';

type Service={name:string,price:number,duration:number};
type Availability={days:number[],start:string,end:string};
type Business={id:string,name:string,category:string,activity:string,type:string,status:'TRIAL'|'ACTIVO'|'SUSPENDIDO',trialEnds:string,location:string,staff:number,availability:Availability[],services:Service[]};
type Appointment={id:string,businessId:string,client:string,email:string,service:string,date:string,time:string,amount:number,payment:string,reference:string,proof:string,status:'PAYMENT_REVIEW'|'CONFIRMED'|'REJECTED'|'COMPLETED'};

const seedBusinesses:Business[]=[
 {id:'med-1',name:'Dra. Sofía Mendoza',category:'Salud',activity:'Cardiología',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',location:'Caracas · Chacao',staff:1,availability:[{days:[1,2,3,4,5],start:'08:00',end:'13:00'}],services:[
  {name:'Consulta cardiológica inicial',price:30,duration:40},{name:'Control cardiológico',price:22,duration:25},{name:'Evaluación preoperatoria',price:35,duration:45},{name:'Lectura de resultados',price:18,duration:20}]},
 {id:'dent-1',name:'Sonrisa Dental',category:'Salud',activity:'Odontología',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Los Palos Grandes',staff:4,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'18:00'}],services:[
  {name:'Consulta odontológica',price:20,duration:30},{name:'Limpieza dental',price:30,duration:45},{name:'Blanqueamiento',price:65,duration:90},{name:'Resina simple',price:28,duration:45},{name:'Extracción simple',price:35,duration:45},{name:'Evaluación de ortodoncia',price:25,duration:30}]},
 {id:'psy-1',name:'Mente Clara',category:'Salud',activity:'Psicología',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',location:'Online / Caracas',staff:1,availability:[{days:[1,2,3,4,5],start:'10:00',end:'19:00'}],services:[
  {name:'Primera consulta',price:25,duration:60},{name:'Sesión individual',price:22,duration:50},{name:'Sesión de pareja',price:35,duration:75},{name:'Orientación breve',price:18,duration:30}]},
 {id:'fisio-1',name:'FisioMove',category:'Salud',activity:'Fisioterapia',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · El Rosal',staff:3,availability:[{days:[1,2,3,4,5,6],start:'07:00',end:'19:00'}],services:[
  {name:'Evaluación funcional',price:20,duration:45},{name:'Sesión de fisioterapia',price:25,duration:60},{name:'Descarga muscular',price:22,duration:45},{name:'Rehabilitación deportiva',price:30,duration:60}]},
 {id:'nutri-1',name:'Vital Nutrición',category:'Salud',activity:'Nutrición',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas / Online',staff:1,availability:[{days:[2,3,4,5,6],start:'09:00',end:'17:00'}],services:[
  {name:'Consulta nutricional inicial',price:25,duration:60},{name:'Control nutricional',price:18,duration:30},{name:'Plan deportivo',price:30,duration:60},{name:'Asesoría online',price:20,duration:45}]},

 {id:'bar-1',name:'Barber Studio 21',category:'Belleza',activity:'Barbería',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Sabana Grande',staff:5,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'20:00'},{days:[0],start:'10:00',end:'17:00'}],services:[
  {name:'Corte clásico',price:12,duration:30},{name:'Fade / degradado',price:15,duration:40},{name:'Corte + barba',price:20,duration:60},{name:'Barba premium',price:10,duration:25},{name:'Corte infantil',price:10,duration:30},{name:'Diseño / líneas',price:5,duration:15},{name:'Cejas',price:4,duration:10},{name:'Corte + lavado + styling',price:18,duration:50}]},
 {id:'nail-1',name:'Luna Nails',category:'Belleza',activity:'Manicurista',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',location:'Caracas · Servicio en estudio',staff:1,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'18:00'}],services:[
  {name:'Manicura tradicional',price:8,duration:35},{name:'Semipermanente',price:15,duration:60},{name:'Acrílicas completas',price:25,duration:120},{name:'Jelly tips',price:22,duration:90},{name:'Gel builder',price:20,duration:90},{name:'Nail art básico',price:6,duration:20},{name:'Nail art premium',price:12,duration:40},{name:'Retiro de sistema',price:7,duration:30},{name:'Mantenimiento',price:16,duration:75},{name:'Pedicura',price:14,duration:60},{name:'Pedicura + semi',price:20,duration:80}]},
 {id:'hair-1',name:'Studio Hair Lab',category:'Belleza',activity:'Peluquería',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Altamira',staff:6,availability:[{days:[1,2,3,4,5,6],start:'08:30',end:'19:30'}],services:[
  {name:'Corte dama',price:18,duration:45},{name:'Corte caballero',price:12,duration:30},{name:'Secado corto',price:12,duration:35},{name:'Secado largo',price:18,duration:50},{name:'Color raíz',price:35,duration:120},{name:'Color completo',price:55,duration:150},{name:'Mechas / balayage',price:75,duration:210},{name:'Keratina',price:65,duration:180},{name:'Hidratación profunda',price:25,duration:60}]},
 {id:'brow-1',name:'Brow & Lash Lab',category:'Belleza',activity:'Cejas y pestañas',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas · La Castellana',staff:1,availability:[{days:[2,3,4,5,6],start:'10:00',end:'19:00'}],services:[
  {name:'Diseño de cejas',price:8,duration:25},{name:'Laminado de cejas',price:18,duration:50},{name:'Lifting de pestañas',price:20,duration:60},{name:'Extensiones clásicas',price:28,duration:120},{name:'Volumen híbrido',price:35,duration:150},{name:'Retoque pestañas',price:20,duration:75}]},
 {id:'make-1',name:'Glow Makeup',category:'Belleza',activity:'Maquillaje',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',location:'Caracas / A domicilio',staff:1,availability:[{days:[1,2,3,4,5,6,0],start:'07:00',end:'19:00'}],services:[
  {name:'Maquillaje social',price:30,duration:60},{name:'Maquillaje de noche',price:35,duration:75},{name:'Maquillaje novia prueba',price:40,duration:90},{name:'Maquillaje novia evento',price:55,duration:120},{name:'Maquillaje + peinado',price:55,duration:120}]},

 {id:'spa-1',name:'Aura Spa',category:'Bienestar',activity:'Spa',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Las Mercedes',staff:5,availability:[{days:[1,2,3,4,5,6,0],start:'09:00',end:'20:00'}],services:[
  {name:'Masaje relajante',price:35,duration:60},{name:'Masaje descontracturante',price:40,duration:60},{name:'Piedras calientes',price:45,duration:75},{name:'Masaje deportivo',price:42,duration:60},{name:'Facial hidratante',price:30,duration:60},{name:'Limpieza facial profunda',price:38,duration:75},{name:'Exfoliación corporal',price:35,duration:60},{name:'Ritual spa pareja',price:80,duration:120}]},
 {id:'yoga-1',name:'Origen Yoga',category:'Bienestar',activity:'Yoga / Pilates',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Los Dos Caminos',staff:3,availability:[{days:[1,2,3,4,5],start:'06:00',end:'20:00'},{days:[6],start:'08:00',end:'13:00'}],services:[
  {name:'Yoga individual',price:18,duration:60},{name:'Pilates individual',price:22,duration:60},{name:'Clase grupal yoga',price:8,duration:60},{name:'Clase grupal pilates',price:10,duration:60},{name:'Evaluación postural',price:15,duration:30}]},
 {id:'coach-1',name:'Balance Coach',category:'Bienestar',activity:'Coaching',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-24',location:'Online',staff:1,availability:[{days:[1,2,3,4,5],start:'09:00',end:'18:00'}],services:[
  {name:'Sesión inicial',price:25,duration:60},{name:'Coaching 1 a 1',price:22,duration:50},{name:'Plan de objetivos',price:30,duration:75},{name:'Seguimiento express',price:15,duration:30}]},

 {id:'pro-1',name:'G&M Consultores',category:'Servicios profesionales',activity:'Contabilidad',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas / Online',staff:4,availability:[{days:[1,2,3,4,5],start:'08:00',end:'17:00'}],services:[
  {name:'Consulta contable',price:25,duration:45},{name:'Asesoría tributaria',price:30,duration:60},{name:'Revisión de deberes formales',price:35,duration:60},{name:'Constitución / orientación empresarial',price:40,duration:60},{name:'Cierre contable - reunión',price:35,duration:60}]},
 {id:'legal-1',name:'Lex Punto Legal',category:'Servicios profesionales',activity:'Abogado',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Chacao / Online',staff:3,availability:[{days:[1,2,3,4,5],start:'09:00',end:'17:00'}],services:[
  {name:'Consulta legal general',price:30,duration:45},{name:'Consulta mercantil',price:40,duration:60},{name:'Revisión de contrato',price:45,duration:60},{name:'Orientación migratoria',price:35,duration:45},{name:'Consulta laboral',price:35,duration:45}]},
 {id:'arch-1',name:'Nodo Arquitectura',category:'Servicios profesionales',activity:'Arquitectura',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas / Visita técnica',staff:4,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'17:00'}],services:[
  {name:'Consulta de diseño',price:30,duration:60},{name:'Visita técnica',price:45,duration:90},{name:'Revisión de planos',price:40,duration:75},{name:'Asesoría de remodelación',price:35,duration:60}]},
 {id:'real-1',name:'Clave Inmobiliaria',category:'Servicios profesionales',activity:'Bienes raíces',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas',staff:5,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'18:00'}],services:[
  {name:'Visita a propiedad',price:0,duration:45},{name:'Valoración inicial',price:20,duration:60},{name:'Reunión propietario',price:0,duration:45},{name:'Asesoría de compra',price:25,duration:60}]},

 {id:'edu-1',name:'English Now',category:'Educación',activity:'Idiomas',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Online / Caracas',staff:6,availability:[{days:[1,2,3,4,5,6],start:'07:00',end:'21:00'}],services:[
  {name:'Prueba de nivel',price:0,duration:30},{name:'Clase individual',price:12,duration:60},{name:'Conversación 1 a 1',price:10,duration:45},{name:'Preparación entrevista',price:15,duration:60},{name:'Clase ejecutiva',price:18,duration:60}]},
 {id:'music-1',name:'Nota Viva',category:'Educación',activity:'Música',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas · Bello Monte',staff:4,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'19:00'}],services:[
  {name:'Clase de guitarra',price:12,duration:60},{name:'Clase de piano',price:15,duration:60},{name:'Clase de canto',price:15,duration:60},{name:'Evaluación musical',price:8,duration:30},{name:'Ensayo guiado',price:18,duration:90}]},
 {id:'drive-1',name:'Autoescuela Vía Segura',category:'Educación',activity:'Escuela de manejo',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas',staff:5,availability:[{days:[1,2,3,4,5,6],start:'07:00',end:'18:00'}],services:[
  {name:'Clase práctica 60 min',price:20,duration:60},{name:'Clase práctica 90 min',price:28,duration:90},{name:'Evaluación de manejo',price:15,duration:45},{name:'Clase de estacionamiento',price:20,duration:60}]},

 {id:'auto-1',name:'Detail Pro',category:'Automotriz',activity:'Detailing',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · La Yaguara',staff:5,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'18:00'}],services:[
  {name:'Lavado premium',price:20,duration:60},{name:'Lavado + aspirado',price:25,duration:75},{name:'Detailing interior',price:45,duration:150},{name:'Detailing completo',price:70,duration:240},{name:'Pulido básico',price:50,duration:180},{name:'Tratamiento cerámico',price:120,duration:360},{name:'Restauración de faros',price:25,duration:60}]},
 {id:'mech-1',name:'Taller Express',category:'Automotriz',activity:'Mecánica ligera',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Los Ruices',staff:6,availability:[{days:[1,2,3,4,5,6],start:'07:30',end:'17:30'}],services:[
  {name:'Diagnóstico básico',price:15,duration:30},{name:'Cambio de aceite',price:20,duration:45},{name:'Revisión de frenos',price:20,duration:45},{name:'Cambio de pastillas',price:35,duration:90},{name:'Escaneo electrónico',price:18,duration:30},{name:'Revisión pre-viaje',price:30,duration:60}]},

 {id:'air-1',name:'ClimaPro',category:'Hogar y técnicos',activity:'Aire acondicionado',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Servicio a domicilio',staff:4,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'18:00'}],services:[
  {name:'Diagnóstico a domicilio',price:15,duration:60},{name:'Mantenimiento split',price:25,duration:90},{name:'Limpieza profunda',price:35,duration:120},{name:'Visita para instalación',price:15,duration:60}]},
 {id:'tech-1',name:'TecnoFix',category:'Hogar y técnicos',activity:'Computación y celulares',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Centro',staff:3,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'18:00'}],services:[
  {name:'Diagnóstico laptop',price:10,duration:30},{name:'Soporte remoto',price:12,duration:45},{name:'Optimización PC',price:20,duration:90},{name:'Diagnóstico celular',price:8,duration:20},{name:'Configuración / respaldo',price:15,duration:60}]},
 {id:'clean-1',name:'CleanHome',category:'Hogar y técnicos',activity:'Limpieza',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-24',location:'Servicio a domicilio',staff:8,availability:[{days:[1,2,3,4,5,6],start:'07:00',end:'18:00'}],services:[
  {name:'Limpieza apartamento pequeño',price:30,duration:180},{name:'Limpieza apartamento mediano',price:45,duration:240},{name:'Limpieza profunda',price:70,duration:360},{name:'Limpieza oficina',price:55,duration:240},{name:'Limpieza Airbnb',price:35,duration:150}]},

 {id:'pet-1',name:'Huellas Grooming',category:'Mascotas',activity:'Grooming',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Prados del Este',staff:3,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'18:00'}],services:[
  {name:'Baño perro pequeño',price:15,duration:60},{name:'Baño + corte pequeño',price:22,duration:90},{name:'Baño + corte mediano',price:28,duration:120},{name:'Deslanado',price:20,duration:60},{name:'Corte de uñas',price:8,duration:20},{name:'Limpieza de oídos',price:6,duration:15}]},
 {id:'vet-1',name:'VetCare',category:'Mascotas',activity:'Veterinaria',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Santa Mónica',staff:4,availability:[{days:[1,2,3,4,5,6],start:'08:00',end:'18:00'}],services:[
  {name:'Consulta veterinaria',price:20,duration:30},{name:'Control',price:15,duration:20},{name:'Vacunación programada',price:18,duration:20},{name:'Consulta cachorro',price:22,duration:40},{name:'Revisión geriátrica',price:25,duration:45}]},

 {id:'fit-1',name:'FitCoach',category:'Deporte',activity:'Entrenamiento personal',type:'Profesional independiente',status:'ACTIVO',trialEnds:'',location:'Caracas / A domicilio',staff:1,availability:[{days:[1,2,3,4,5,6],start:'06:00',end:'20:00'}],services:[
  {name:'Evaluación física',price:15,duration:45},{name:'Sesión personal',price:18,duration:60},{name:'Sesión pareja',price:25,duration:60},{name:'Entrenamiento funcional',price:20,duration:60},{name:'Plan + sesión',price:30,duration:75}]},
 {id:'padel-1',name:'Padel Zone',category:'Deporte',activity:'Cancha de pádel',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · La Trinidad',staff:4,availability:[{days:[1,2,3,4,5,6,0],start:'06:00',end:'23:00'}],services:[
  {name:'Cancha 60 min',price:25,duration:60},{name:'Cancha 90 min',price:35,duration:90},{name:'Cancha 120 min',price:45,duration:120},{name:'Clase individual',price:30,duration:60},{name:'Clase pareja',price:40,duration:60}]},

 {id:'cow-1',name:'WorkHub',category:'Espacios y alquiler',activity:'Coworking',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Chacao',staff:3,availability:[{days:[1,2,3,4,5,6],start:'07:00',end:'21:00'}],services:[
  {name:'Sala reunión 1 hora',price:15,duration:60},{name:'Sala reunión 2 horas',price:28,duration:120},{name:'Oficina privada 2 horas',price:35,duration:120},{name:'Oficina privada 4 horas',price:60,duration:240},{name:'Escritorio día',price:12,duration:480}]},
 {id:'studio-1',name:'Wave Studio',category:'Espacios y alquiler',activity:'Estudio de grabación',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas · Los Chaguaramos',staff:3,availability:[{days:[1,2,3,4,5,6,0],start:'09:00',end:'23:00'}],services:[
  {name:'Estudio 1 hora',price:25,duration:60},{name:'Estudio 2 horas',price:45,duration:120},{name:'Grabación + ingeniero',price:60,duration:120},{name:'Podcast 1 hora',price:30,duration:60},{name:'Sesión mezcla revisión',price:20,duration:45}]},

 {id:'photo-1',name:'Luz Foto Studio',category:'Eventos',activity:'Fotografía',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas / Locación',staff:4,availability:[{days:[1,2,3,4,5,6,0],start:'08:00',end:'19:00'}],services:[
  {name:'Mini sesión',price:30,duration:30},{name:'Retrato individual',price:45,duration:60},{name:'Sesión pareja',price:55,duration:75},{name:'Sesión familiar',price:65,duration:90},{name:'Preboda',price:80,duration:120},{name:'Reunión evento',price:0,duration:45}]},
 {id:'event-1',name:'Momentos Planner',category:'Eventos',activity:'Wedding planner / eventos',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas / Online',staff:4,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'18:00'}],services:[
  {name:'Consulta inicial',price:20,duration:60},{name:'Planificación boda',price:35,duration:75},{name:'Visita de locación',price:30,duration:90},{name:'Reunión proveedores',price:25,duration:60},{name:'Planificación cumpleaños',price:25,duration:60}]},

 {id:'tattoo-1',name:'Arte Ink',category:'Otro',activity:'Tattoo & piercing',type:'Negocio / local',status:'ACTIVO',trialEnds:'',location:'Caracas · Chacao',staff:4,availability:[{days:[2,3,4,5,6],start:'11:00',end:'20:00'}],services:[
  {name:'Consulta de diseño',price:0,duration:30},{name:'Tatuaje pequeño',price:35,duration:60},{name:'Tatuaje mediano',price:70,duration:120},{name:'Sesión 3 horas',price:150,duration:180},{name:'Piercing básico',price:20,duration:30},{name:'Control de cicatrización',price:0,duration:15}]},
 {id:'tailor-1',name:'Atelier Punto Fino',category:'Otro',activity:'Sastrería y arreglos',type:'Negocio / local',status:'TRIAL',trialEnds:'2026-09-24',location:'Caracas · El Paraíso',staff:3,availability:[{days:[1,2,3,4,5,6],start:'09:00',end:'18:00'}],services:[
  {name:'Toma de medidas',price:5,duration:30},{name:'Prueba de traje',price:0,duration:30},{name:'Ajuste vestido',price:12,duration:45},{name:'Consulta confección',price:10,duration:45}]},

 {id:'adult-1',name:'Reserva Privada',category:'Servicios 18+',activity:'Servicio privado con reserva',type:'Profesional independiente',status:'TRIAL',trialEnds:'2026-09-24',location:'Ubicación privada',staff:1,availability:[{days:[1,2,3,4,5,6,0],start:'12:00',end:'22:00'}],services:[
  {name:'Reserva privada 60 min',price:40,duration:60},{name:'Reserva privada 90 min',price:55,duration:90},{name:'Reserva privada 120 min',price:70,duration:120}]}
];

const seedAppointments:Appointment[]=[
 {id:'apt-1',businessId:'med-1',client:'María González',email:'maria@example.com',service:'Consulta cardiológica',date:'2026-09-19',time:'09:00',amount:30,payment:'Pago móvil',reference:'458921',proof:'capture_demo.jpg',status:'CONFIRMED'},
 {id:'apt-2',businessId:'bar-1',client:'Carlos Rojas',email:'carlos@example.com',service:'Corte + barba',date:'2026-09-19',time:'11:30',amount:18,payment:'Binance',reference:'BNC-88921',proof:'binance_demo.png',status:'PAYMENT_REVIEW'},
 {id:'apt-3',businessId:'spa-1',client:'Ana Torres',email:'ana@example.com',service:'Masaje relajante',date:'2026-09-20',time:'15:00',amount:35,payment:'PayPal',reference:'PP-21098',proof:'paypal_demo.png',status:'PAYMENT_REVIEW'}
];

const dayNames=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const toMinutes=(v:string)=>{const [h,m]=v.split(':').map(Number);return h*60+m};
const toClock=(m:number)=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const categories=['Salud','Belleza','Bienestar','Servicios profesionales','Educación','Automotriz','Hogar y técnicos','Mascotas','Deporte','Espacios y alquiler','Eventos','Servicios 18+','Otro'];

const demoDate=()=>new Date(Date.now()+2*86400000).toISOString().slice(0,10);

export default function Demo(){
 const [view,setView]=useState<'home'|'master'|'professional'|'client'>('home');
 const [businesses,setBusinesses]=useState<Business[]>(seedBusinesses);
 const [appointments,setAppointments]=useState<Appointment[]>(seedAppointments);
 const [selectedBusiness,setSelectedBusiness]=useState('med-1');
 const [selectedService,setSelectedService]=useState('');
 const [date,setDate]=useState(demoDate);
 const [time,setTime]=useState('');
 const [client,setClient]=useState('');
 const [email,setEmail]=useState('');
 const [payment,setPayment]=useState('PayPal');
 const [reference,setReference]=useState('');
 const [proof,setProof]=useState('');
 const [msg,setMsg]=useState('');
 const [showCreate,setShowCreate]=useState(false);
 const [categoryFilter,setCategoryFilter]=useState('Todos');
 const [tourStep,setTourStep]=useState(-1);
 const [newBiz,setNewBiz]=useState({name:'',category:'Belleza',activity:'Barbería',type:'Profesional independiente'});

 useEffect(()=>{
  try{
   const b=localStorage.getItem('turnavia-demo-v5-businesses');
   const a=localStorage.getItem('turnavia-demo-v5-appointments');
   if(b)setBusinesses(JSON.parse(b));
   if(a)setAppointments(JSON.parse(a));
  }catch{}
 },[]);
 useEffect(()=>{try{localStorage.setItem('turnavia-demo-v5-businesses',JSON.stringify(businesses))}catch{}},[businesses]);
 useEffect(()=>{try{localStorage.setItem('turnavia-demo-v5-appointments',JSON.stringify(appointments))}catch{}},[appointments]);

 const biz=useMemo(()=>businesses.find(b=>b.id===selectedBusiness)||businesses[0],[businesses,selectedBusiness]);
 const service=useMemo(()=>biz?.services.find(s=>s.name===selectedService)||biz?.services[0],[biz,selectedService]);
 const bizAppointments=useMemo(()=>appointments.filter(a=>a.businessId===biz?.id),[appointments,biz]);
 const filteredBusinesses=useMemo(()=>categoryFilter==='Todos'?businesses:businesses.filter(b=>b.category===categoryFilter),[businesses,categoryFilter]);

 const availableSlots=useMemo(()=>{
   if(!biz||!service||!date)return [];
   const day=new Date(date+'T12:00:00').getDay();
   const duration=service.duration;
   const result:string[]=[];
   for(const window of biz.availability||[]){
     if(!window.days.includes(day))continue;
     for(let m=toMinutes(window.start);m+duration<=toMinutes(window.end);m+=15){
       const start=m,end=m+duration;
       const busy=bizAppointments.some(a=>{
         if(a.date!==date||a.status==='REJECTED')return false;
         const other=biz.services.find(s=>s.name===a.service);
         const aStart=toMinutes(a.time),aEnd=aStart+(other?.duration||30);
         return aStart<end&&aEnd>start;
       });
       if(!busy)result.push(toClock(m));
     }
   }
   return Array.from(new Set(result));
 },[biz,service,date,bizAppointments]);

 useEffect(()=>{
   if(availableSlots.length&&!availableSlots.includes(time))setTime(availableSlots[0]);
   if(!availableSlots.length&&time)setTime('');
 },[availableSlots,time]);

 function reset(){
  setBusinesses(seedBusinesses);setAppointments(seedAppointments);setSelectedBusiness('med-1');setSelectedService('');setDate(demoDate());setTime('');setCategoryFilter('Todos');setMsg('Demo reiniciada con todo el catálogo precargado.');
  try{localStorage.removeItem('turnavia-demo-v5-businesses');localStorage.removeItem('turnavia-demo-v5-appointments')}catch{}
 }
 function changeAppointment(id:string,status:Appointment['status']){
  setAppointments(v=>v.map(a=>a.id===id?{...a,status}:a));
  setMsg('Estado de la reserva actualizado.');
 }
 function book(){
  if(!client.trim()||!email.trim()||!reference.trim()){setMsg('Completa nombre, correo y referencia de pago.');return}
  if(!service||!availableSlots.includes(time)){setMsg('Selecciona un servicio y una hora disponible.');return}
  const a:Appointment={id:'apt-'+Date.now(),businessId:biz.id,client:client.trim(),email:email.trim(),service:service.name,date,time,amount:service.price,payment,reference:reference.trim(),proof:proof||'comprobante_demo.png',status:'PAYMENT_REVIEW'};
  setAppointments(v=>[a,...v]);setMsg('Reserva creada. El pago quedó en revisión y ya aparece en el panel profesional.');
 }
 function createBusiness(){
  if(!newBiz.name.trim()){setMsg('Escribe el nombre del negocio o profesional.');return}
  const id='biz-'+Date.now();
  const end=new Date(Date.now()+5*86400000).toISOString().slice(0,10);
  const b:Business={id,name:newBiz.name.trim(),category:newBiz.category,activity:newBiz.activity||'Otro',type:newBiz.type,status:'TRIAL',trialEnds:end,location:'Por configurar',staff:newBiz.type.startsWith('Negocio')?3:1,availability:[{days:[1,2,3,4,5],start:'09:00',end:'17:00'}],services:[{name:'Servicio inicial',price:20,duration:30}]};
  setBusinesses(v=>[b,...v]);setSelectedBusiness(id);setShowCreate(false);setMsg('Nueva prueba creada con 5 días gratis.');
 }
 const statusLabel=(s:string)=>({TRIAL:'Prueba 5 días',ACTIVO:'Activo',SUSPENDIDO:'Suspendido',PAYMENT_REVIEW:'Pago en revisión',CONFIRMED:'Confirmada',REJECTED:'Pago rechazado',COMPLETED:'Completada'} as any)[s]||s;
 const tone=(s:string)=>['ACTIVO','CONFIRMED','COMPLETED'].includes(s)?'ok':['SUSPENDIDO','REJECTED'].includes(s)?'bad':'warn';

 const tourSteps=[
  {title:'1. Qué es TURNAVIA',text:'Primero enseña la idea general: una sola plataforma sirve para muchos rubros. Aquí puedes filtrar Salud, Belleza, Automotriz, Mascotas y más.',view:'home' as const,businessId:'med-1',service:''},
  {title:'2. El negocio configura su operación',text:'Ahora mostramos una barbería. El dueño ve su horario semanal, personal, reservas y toda la operación desde un solo panel.',view:'professional' as const,businessId:'bar-1',service:''},
  {title:'3. Cada servicio tiene tiempo y precio',text:'Un corte clásico puede durar 30 minutos y un corte + barba 60. TURNAVIA usa esa duración para evitar choques de horario.',view:'professional' as const,businessId:'bar-1',service:'Corte + barba'},
  {title:'4. El mismo motor sirve para uñas',text:'En una manicurista cambian los servicios: acrílicas, semipermanente, jelly tips, pedicura, mantenimiento y más. Cada uno tiene precio y duración propios.',view:'professional' as const,businessId:'nail-1',service:'Acrílicas completas'},
  {title:'5. Así reserva el cliente',text:'El cliente elige negocio, servicio, fecha y solo ve horas donde el servicio cabe completo dentro de la disponibilidad real.',view:'client' as const,businessId:'nail-1',service:'Acrílicas completas'},
  {title:'6. Pago y comprobante',text:'Después registra método, referencia y comprobante. La reserva queda preagendada mientras el profesional revisa el pago.',view:'client' as const,businessId:'bar-1',service:'Corte + barba'},
  {title:'7. El profesional confirma',text:'En el panel profesional aparecen las reservas y pagos por revisar. Puede aprobar, rechazar y luego marcar la atención como completada.',view:'professional' as const,businessId:'bar-1',service:'Corte + barba'},
  {title:'8. Control desde Master',text:'Finalmente enseña tu panel Master: pruebas gratis, clientes, negocios activos, suscripciones y control comercial de toda la plataforma.',view:'master' as const,businessId:'bar-1',service:''}
 ];

 function goTour(index:number){
   if(index<0){setTourStep(-1);return}
   const bounded=Math.min(index,tourSteps.length-1);
   const step=tourSteps[bounded];
   setTourStep(bounded);
   setView(step.view);
   setSelectedBusiness(step.businessId);
   setSelectedService(step.service);
   setMsg('');
   setTimeout(()=>window.scrollTo({top:0,behavior:'smooth'}),50);
 }


 return <main className="demo-chooser">
  <div className="container" style={{paddingTop:28,paddingBottom:50}}>
   <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
    <Brand/>
    <div className="row" style={{gap:8,flexWrap:'wrap'}}>
      {view!=='home'&&<button className="btn btn-secondary" onClick={()=>setView('home')}><ArrowLeft size={16}/> Demo</button>}
      <button className="btn btn-primary" onClick={()=>goTour(0)}><PlayCircle size={16}/> Recorrido guiado</button>
      <button className="btn btn-secondary" onClick={reset}><RefreshCw size={16}/> Reiniciar</button>
      <Link href="/" className="btn btn-secondary">Inicio real</Link>
    </div>
   </div>

   {msg&&<div className="notice" style={{marginTop:18}}>{msg}</div>}

   {view==='home'&&<>
    <div className="demo-head">
      <span className="eyebrow"><Sparkles size={15}/> DEMO COMERCIAL MULTIRRUBRO</span>
      <h1>Una agenda para prácticamente cualquier negocio por reserva.</h1>
      <p className="muted">TURNAVIA adapta servicios, duración, precio, disponibilidad, pagos y operación según el rubro. Este demo está precargado para mostrar la amplitud del producto sin tocar datos reales.</p>
      <div className="hero-actions" style={{marginTop:18}}>
        <button className="btn btn-primary" onClick={()=>goTour(0)}><PlayCircle size={17}/> Ver demo explicado paso a paso</button>
        <button className="btn btn-secondary" onClick={()=>{setTourStep(-1);setCategoryFilter('Todos')}}><Eye size={17}/> Explorar libremente</button>
      </div>
      <div className="notice" style={{marginTop:14,textAlign:'left'}}><Lightbulb size={17} style={{verticalAlign:'middle',marginRight:7}}/><strong>Para vender TURNAVIA:</strong> usa “Recorrido guiado”. Va explicando qué problema resuelve cada pantalla mientras tú solo vas pulsando “Siguiente”.</div>
    </div>
    <div className="stat-grid">
      <div className="stat"><Building2 size={18}/><small>Negocios demo</small><div className="n">{businesses.length}</div></div>
      <div className="stat"><BriefcaseBusinessIcon/><small>Servicios cargados</small><div className="n">{businesses.reduce((n,b)=>n+b.services.length,0)}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Activos</small><div className="n">{businesses.filter(b=>b.status==='ACTIVO').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Reservas en revisión</small><div className="n">{appointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
    </div>

    <div className="role-grid" style={{marginTop:20}}>
      <button className="role-card" onClick={()=>setView('master')}><div className="iconbox"><ShieldCheck/></div><h3>Master</h3><p>Clientes, pruebas, activaciones y control comercial.</p><div className="go">Entrar al Master</div></button>
      <button className="role-card" onClick={()=>setView('professional')}><div className="iconbox"><HeartPulse/></div><h3>Profesional / Negocio</h3><p>Servicios, disponibilidad, agenda, pagos y atención.</p><div className="go">Entrar al panel</div></button>
      <button className="role-card" onClick={()=>setView('client')}><div className="iconbox"><UserRound/></div><h3>Cliente</h3><p>Elige servicio, duración, fecha, hora y paga.</p><div className="go">Reservar ahora</div></button>
    </div>

    <section className="panel" style={{marginTop:20}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
        <div><h2>Vitrina completa por rubro</h2><p className="muted">Selecciona una categoría para mostrar ejemplos de negocios y servicios.</p></div>
        <span className="pill">{filteredBusinesses.length} ejemplos visibles</span>
      </div>
      <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:12}}>
        <button className={'btn '+(categoryFilter==='Todos'?'btn-primary':'btn-secondary')} onClick={()=>setCategoryFilter('Todos')}>Todos</button>
        {categories.map(cat=><button className={'btn '+(categoryFilter===cat?'btn-primary':'btn-secondary')} onClick={()=>setCategoryFilter(cat)} key={cat}>{cat}</button>)}
      </div>
      <div className="grid-3" style={{marginTop:18}}>{filteredBusinesses.map(b=><button key={b.id} className="card" style={{textAlign:'left',cursor:'pointer'}} onClick={()=>{setSelectedBusiness(b.id);setSelectedService('');setView('professional')}}>
        <div className="row space"><span className="eyebrow">{b.category}</span><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span></div>
        <h3>{b.name}</h3>
        <p>{b.activity} · {b.location}</p>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}><span className="pill">{b.services.length} servicios</span><span className="pill">{b.staff} profesional{b.staff===1?'':'es'}</span></div>
        <div className="muted" style={{fontSize:12,marginTop:10}}>{b.services.slice(0,3).map(s=>s.name).join(' · ')}{b.services.length>3?' · …':''}</div>
      </button>)}</div>
      <div className="notice" style={{marginTop:14}}>Servicios 18+ se mantiene discreto y limitado a mayores de edad y actividades permitidas por la legislación aplicable.</div>
    </section>
   </>}

   {view==='master'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Administración comercial</div><h1>Panel Master · Demo</h1></div><button className="btn btn-primary" onClick={()=>setShowCreate(v=>!v)}><Plus size={16}/> Nueva prueba</button></div>
    {showCreate&&<section className="panel" style={{marginBottom:18}}>
      <h2>Crear negocio de prueba</h2>
      <div className="form">
       <div className="field"><label>Nombre</label><input value={newBiz.name} onChange={e=>setNewBiz({...newBiz,name:e.target.value})} placeholder="Ej. Barbería Central"/></div>
       <div className="row" style={{alignItems:'stretch',gap:12,flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Rubro</label><select value={newBiz.category} onChange={e=>setNewBiz({...newBiz,category:e.target.value})}>{categories.map(cat=><option key={cat}>{cat}</option>)}</select></div>
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
      <div className="stat"><DollarSign size={18}/><small>MRR demo</small><div className="n">{'$'}{businesses.filter(b=>b.status==='ACTIVO').reduce((n,b)=>n+(b.type.startsWith('Negocio')?49:15),0)}</div></div>
    </div>
    <section className="panel" style={{marginTop:18}}>
     <h2>Clientes y suscripciones</h2>
     <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Rubro</th><th>Plan</th><th>Equipo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{businesses.map(b=><tr key={b.id}><td><strong>{b.name}</strong><div className="muted" style={{fontSize:12}}>{b.activity} · {b.location}</div></td><td>{b.category}</td><td>{b.type}</td><td>{b.staff}</td><td><span className={'status '+tone(b.status)}>{statusLabel(b.status)}</span>{b.trialEnds&&b.status==='TRIAL'&&<div className="muted" style={{fontSize:12}}>Hasta {b.trialEnds}</div>}</td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{b.status!=='ACTIVO'&&<button className="btn btn-primary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Activar</button>}{b.status==='ACTIVO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'SUSPENDIDO'}:x))}>Suspender</button>}{b.status==='SUSPENDIDO'&&<button className="btn btn-secondary" onClick={()=>setBusinesses(v=>v.map(x=>x.id===b.id?{...x,status:'ACTIVO'}:x))}>Reactivar</button>}</div></td></tr>)}</tbody></table></div>
    </section>
   </>}

   {view==='professional'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Operación diaria</div><h1>Panel Profesional / Negocio</h1></div></div>
    <section className="panel">
      <div className="field"><label>Escenario de demo</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
      <div className="row space" style={{marginTop:14,alignItems:'flex-start',gap:16,flexWrap:'wrap'}}><div><span className="eyebrow">{biz.category}</span><h2 style={{marginTop:10}}>{biz.name}</h2><div className="muted">{biz.activity} · {biz.type}</div><div className="row muted" style={{fontSize:13,marginTop:8}}><MapPin size={15}/>{biz.location}</div></div><span className={'status '+tone(biz.status)}>{statusLabel(biz.status)}</span></div>
    </section>

    <div className="panel-grid" style={{marginTop:18}}>
      <section className="panel">
        <h2>Disponibilidad semanal</h2>
        <p className="muted">Cada profesional define sus días y horas reales de atención.</p>
        <div className="grid-3" style={{marginTop:12}}>{biz.availability.map((a,i)=><div className="card" key={i}><CalendarDays size={18}/><strong>{a.days.map(d=>dayNames[d]).join(', ')}</strong><p>{a.start} – {a.end}</p></div>)}</div>
      </section>
      <section className="panel">
        <h2>Equipo</h2>
        <div className="stat" style={{marginTop:12}}><Users size={18}/><small>Profesionales / puestos</small><div className="n">{biz.staff}</div></div>
        <p className="muted" style={{marginTop:12}}>En la versión comercial un negocio puede organizar varios profesionales y sus agendas desde una misma cuenta.</p>
      </section>
    </div>

    <section className="panel" style={{marginTop:18}}>
      <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Servicios, duración y precio</h2><p className="muted">El cliente ve exactamente cuánto dura y cuánto cuesta cada opción.</p></div><span className="pill">{biz.services.length} servicios</span></div>
      <div className="grid-3" style={{marginTop:14}}>{biz.services.map(s=><div className="card" key={s.name}><Sparkles size={18}/><h3>{s.name}</h3><div className="row space"><span className="pill">{s.duration} min</span><strong>{'$'}{s.price}</strong></div></div>)}</div>
    </section>

    <div className="stat-grid" style={{marginTop:18}}>
      <div className="stat"><Clock3 size={18}/><small>Reservas</small><div className="n">{bizAppointments.length}</div></div>
      <div className="stat"><Eye size={18}/><small>Pagos por revisar</small><div className="n">{bizAppointments.filter(a=>a.status==='PAYMENT_REVIEW').length}</div></div>
      <div className="stat"><CheckCircle2 size={18}/><small>Confirmadas</small><div className="n">{bizAppointments.filter(a=>a.status==='CONFIRMED').length}</div></div>
      <div className="stat"><DollarSign size={18}/><small>Valor reservado</small><div className="n">{'$'}{bizAppointments.reduce((n,a)=>n+a.amount,0)}</div></div>
    </div>

    <section className="panel" style={{marginTop:18}}>
     <h2>Agenda y revisión de pagos</h2>
     {bizAppointments.length===0?<div className="notice">Este negocio todavía no tiene reservas. Entra al módulo Cliente y crea una para demostrar el flujo.</div>:<div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Pago</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{bizAppointments.map(a=><tr key={a.id}><td><strong>{a.client}</strong><div className="muted" style={{fontSize:12}}>{a.email}</div></td><td>{a.service}<div className="muted" style={{fontSize:12}}>{'$'}{a.amount}</div></td><td>{a.date}<br/>{a.time}</td><td>{a.payment}<div><strong>Ref: {a.reference}</strong></div><div className="muted" style={{fontSize:12}}>{a.proof}</div></td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td><td><div className="row" style={{gap:6,flexWrap:'wrap'}}>{a.status==='PAYMENT_REVIEW'&&<><button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'CONFIRMED')}>Aprobar</button><button className="btn btn-secondary" onClick={()=>changeAppointment(a.id,'REJECTED')}>Rechazar</button></>}{a.status==='CONFIRMED'&&<button className="btn btn-primary" onClick={()=>changeAppointment(a.id,'COMPLETED')}>Completar</button>}</div></td></tr>)}</tbody></table></div>}
    </section>
   </>}

   {view==='client'&&<>
    <div className="topbar" style={{marginTop:30}}><div><div className="muted" style={{fontSize:13}}>Reserva pública</div><h1>Reserva un servicio</h1></div></div>
    <div className="panel-grid" style={{gridTemplateColumns:'1fr .8fr'}}>
      <section className="panel">
       <div className="field"><label>Profesional o negocio</label><select value={selectedBusiness} onChange={e=>{setSelectedBusiness(e.target.value);setSelectedService('')}}>{businesses.filter(b=>b.status!=='SUSPENDIDO').map(b=><option key={b.id} value={b.id}>{b.name} · {b.activity}</option>)}</select></div>
       <div className="notice" style={{marginTop:12}}><strong>{biz.name}</strong><br/>{biz.category} · {biz.activity}<br/><span className="muted">{biz.location} · {biz.staff} profesional{biz.staff===1?'':'es'}</span><div style={{marginTop:8}}>{biz.availability.map((a,i)=><span className="pill" style={{marginRight:6,marginBottom:6}} key={i}>{a.days.map(d=>dayNames[d]).join('/')} · {a.start}-{a.end}</span>)}</div></div>
       <div className="field" style={{marginTop:14}}><label>Servicio</label><select value={service?.name||''} onChange={e=>setSelectedService(e.target.value)}>{biz.services.map(s=><option key={s.name} value={s.name}>{s.name} · {'$'}{s.price} · {s.duration} min</option>)}</select></div>
       {service&&<div className="notice"><strong>{service.name}</strong><br/>{service.duration} minutos · <strong>{'$'}{service.price}</strong><br/><span className="muted">Las horas se recalculan según la duración elegida y las reservas existentes.</span></div>}
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:180}}><label>Fecha</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
        <div className="field" style={{flex:1,minWidth:180}}><label>Hora disponible</label><select value={time} onChange={e=>setTime(e.target.value)} disabled={!availableSlots.length}>{availableSlots.length?availableSlots.map(s=><option key={s}>{s}</option>):<option>Sin disponibilidad</option>}</select></div>
       </div>
       {!availableSlots.length&&<div className="notice">Ese día el negocio no atiende o no existe un bloque suficientemente largo para completar el servicio. Elige otra fecha.</div>}
       <div className="row" style={{gap:12,alignItems:'stretch',flexWrap:'wrap'}}>
        <div className="field" style={{flex:1,minWidth:220}}><label>Tu nombre</label><input value={client} onChange={e=>setClient(e.target.value)} placeholder="Nombre real del cliente"/></div>
        <div className="field" style={{flex:1,minWidth:220}}><label>Correo</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com"/></div>
       </div>
      </section>
      <aside className="panel">
       <h2>Pago y confirmación</h2>
       <div className="stat" style={{padding:0,border:0,marginBottom:14}}><small>Total</small><div className="n">{'$'}{service?.price||0}</div></div>
       <div className="field"><label>Método</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>PayPal</option><option>Binance</option><option>Pago móvil</option><option>Efectivo</option></select></div>
       <div className="field"><label>Referencia</label><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Número o ID de transacción"/></div>
       <div className="field"><label>Comprobante</label><input type="file" accept="image/*,.pdf" onChange={e=>setProof(e.target.files?.[0]?.name||'')}/>{proof&&<div className="muted" style={{fontSize:12}}>{proof}</div>}</div>
       <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={book}>Preagendar y enviar pago</button>
       <div className="notice" style={{marginTop:14}}>El horario queda preagendado. El profesional o negocio revisa la referencia y el comprobante antes de confirmar.</div>
      </aside>
    </div>

    <section className="panel" style={{marginTop:18}}>
      <h2>Últimas reservas del demo</h2>
      <div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Cliente</th><th>Negocio</th><th>Servicio</th><th>Estado</th></tr></thead><tbody>{appointments.slice(0,10).map(a=>{const b=businesses.find(x=>x.id===a.businessId);return <tr key={a.id}><td>{a.client}</td><td>{b?.name}</td><td>{a.service}</td><td><span className={'status '+tone(a.status)}>{statusLabel(a.status)}</span></td></tr>})}</tbody></table></div>
    </section>
   </>}

   {tourStep>=0&&<div style={{position:'fixed',right:18,bottom:18,zIndex:1000,width:'min(420px,calc(100vw - 36px))',background:'var(--surface)',border:'1px solid var(--line)',borderRadius:18,boxShadow:'0 18px 50px rgba(0,0,0,.22)',padding:18}}>
     <div className="row space" style={{gap:12,alignItems:'flex-start'}}>
       <div><span className="eyebrow">RECORRIDO GUIADO · {tourStep+1}/{tourSteps.length}</span><h3 style={{margin:'8px 0 6px'}}>{tourSteps[tourStep].title}</h3></div>
       <button className="btn btn-secondary" style={{padding:8}} onClick={()=>setTourStep(-1)} aria-label="Cerrar recorrido"><X size={16}/></button>
     </div>
     <p className="muted" style={{margin:'0 0 14px'}}>{tourSteps[tourStep].text}</p>
     <div style={{height:6,background:'var(--line)',borderRadius:99,overflow:'hidden',marginBottom:14}}><div style={{height:'100%',width:((tourStep+1)/tourSteps.length*100)+'%',background:'var(--primary)',borderRadius:99}}/></div>
     <div className="row space" style={{gap:8}}>
       <button className="btn btn-secondary" disabled={tourStep===0} onClick={()=>goTour(tourStep-1)}><ChevronLeft size={16}/> Anterior</button>
       {tourStep<tourSteps.length-1?<button className="btn btn-primary" onClick={()=>goTour(tourStep+1)}>Siguiente <ChevronRight size={16}/></button>:<button className="btn btn-primary" onClick={()=>{setTourStep(-1);setView('home');window.scrollTo({top:0,behavior:'smooth'})}}><CheckCircle2 size={16}/> Finalizar</button>}
     </div>
   </div>}
  </div>
 </main>
}

function BriefcaseBusinessIcon(){return <Sparkles size={18}/>}
