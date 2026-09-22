export type AppointmentStatus = 'AWAITING_PAYMENT'|'PAYMENT_REVIEW'|'PAYMENT_REJECTED'|'CONFIRMED'|'ON_THE_WAY'|'ARRIVED'|'IN_CONSULTATION'|'COMPLETED'|'CANCELLED'|'NO_SHOW';
export type DoctorStatus = 'NORMAL'|'DELAYED'|'SUSPENDED';

export type Appointment = {
  id: string;
  doctorSlug: string;
  doctorName: string;
  patient: string;
  nationalId: string;
  phone: string;
  email?: string;
  reason?: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  location: string;
  consultationPrice: number;
  currency: string;
  paymentMethod?: string;
  paymentReference?: string;
  paymentProofName?: string;
  paymentProofDataUrl?: string;
  paymentSubmittedAt?: string;
  paymentApprovedAt?: string;
  rescheduleUsed: boolean;
  policyAccepted: boolean;
};

export type Availability = {
  id: string;
  doctorSlug: string;
  date: string;
  start: string;
  end: string;
  slotMinutes: number;
  location: string;
};

type DemoState = {
  doctorStatus: DoctorStatus;
  delayMinutes: number;
  consultationPrice: number;
  currency: string;
  paymentInstructions: string;
  availability: Availability[];
  appointments: Appointment[];
};

const date = '2026-09-18';
export const initialDemoState: DemoState = {
  doctorStatus: 'NORMAL',
  delayMinutes: 0,
  consultationPrice: 30,
  currency: 'USD',
  paymentInstructions: 'Realiza el pago al método indicado por la doctora y conserva el comprobante. La cita se confirma únicamente después de que la doctora o recepción valide el pago.',
  availability: [
    { id:'a1', doctorSlug:'sofia-mendoza', date, start:'08:00', end:'12:00', slotMinutes:30, location:'Centro Médico Caracas · Consultorio 204' },
    { id:'a2', doctorSlug:'sofia-mendoza', date:'2026-09-24', start:'08:00', end:'12:00', slotMinutes:30, location:'Centro Médico Caracas · Consultorio 204' },
    { id:'a3', doctorSlug:'sofia-mendoza', date:'2026-09-25', start:'08:00', end:'12:00', slotMinutes:30, location:'Centro Médico Caracas · Consultorio 204' },
  ],
  appointments: [
    { id:'p1', doctorSlug:'sofia-mendoza', doctorName:'Dra. Sofía Mendoza', patient:'María González', nationalId:'V-12.345.678', phone:'0412-0000000', reason:'Control cardiológico', startsAt:`${date}T08:00:00-04:00`, endsAt:`${date}T08:30:00-04:00`, status:'COMPLETED', location:'Centro Médico Caracas · Consultorio 204',consultationPrice:30,currency:'USD',paymentMethod:'Pago móvil',paymentReference:'458923',paymentProofName:'comprobante-maria.jpg',paymentApprovedAt:'2026-09-17T14:00:00-04:00',rescheduleUsed:false,policyAccepted:true },
    { id:'p2', doctorSlug:'sofia-mendoza', doctorName:'Dra. Sofía Mendoza', patient:'Pedro Ruiz', nationalId:'V-10.222.333', phone:'0414-1112233', reason:'Consulta', startsAt:`${date}T08:30:00-04:00`, endsAt:`${date}T09:00:00-04:00`, status:'IN_CONSULTATION', location:'Centro Médico Caracas · Consultorio 204',consultationPrice:30,currency:'USD',paymentMethod:'Binance',paymentReference:'BN-88231',paymentProofName:'binance-pedro.png',paymentApprovedAt:'2026-09-17T15:00:00-04:00',rescheduleUsed:false,policyAccepted:true },
    { id:'p3', doctorSlug:'sofia-mendoza', doctorName:'Dra. Sofía Mendoza', patient:'Ana Torres', nationalId:'V-15.999.111', phone:'0424-2223344', reason:'Control', startsAt:`${date}T09:00:00-04:00`, endsAt:`${date}T09:30:00-04:00`, status:'ARRIVED', location:'Centro Médico Caracas · Consultorio 204',consultationPrice:30,currency:'USD',paymentMethod:'PayPal',paymentReference:'PP-23192',paymentProofName:'paypal-ana.pdf',paymentApprovedAt:'2026-09-17T16:00:00-04:00',rescheduleUsed:false,policyAccepted:true },
    { id:'p4', doctorSlug:'sofia-mendoza', doctorName:'Dra. Sofía Mendoza', patient:'José Méndez', nationalId:'V-18.121.121', phone:'0412-3334455', reason:'Primera consulta', startsAt:`${date}T09:30:00-04:00`, endsAt:`${date}T10:00:00-04:00`, status:'PAYMENT_REVIEW', location:'Centro Médico Caracas · Consultorio 204',consultationPrice:30,currency:'USD',paymentMethod:'Pago móvil',paymentReference:'994821',paymentProofName:'capture-jose.png',paymentSubmittedAt:'2026-09-17T17:00:00-04:00',rescheduleUsed:false,policyAccepted:true },
  ]
};

declare global { var __tucitaDemo: DemoState | undefined }
export const demoStore: DemoState = globalThis.__tucitaDemo ?? structuredClone(initialDemoState);
if (!globalThis.__tucitaDemo) globalThis.__tucitaDemo = demoStore;

export function resetDemoStore(){
  const fresh=structuredClone(initialDemoState);
  Object.assign(demoStore,fresh);
}

export const statusLabel: Record<AppointmentStatus,string> = {
  AWAITING_PAYMENT:'Esperando pago', PAYMENT_REVIEW:'Pago en revisión', PAYMENT_REJECTED:'Pago rechazado', CONFIRMED:'Confirmado', ON_THE_WAY:'En camino', ARRIVED:'Ya llegó', IN_CONSULTATION:'En consulta', COMPLETED:'Atendido', CANCELLED:'Cancelado', NO_SHOW:'No asistió'
};

export function makeSlots(av: Availability, appointments = demoStore.appointments){
  const [sh,sm]=av.start.split(':').map(Number); const [eh,em]=av.end.split(':').map(Number);
  const start=sh*60+sm, end=eh*60+em; const out:{time:string;available:boolean;startsAt:string}[]=[];
  for(let m=start;m<end;m+=av.slotMinutes){
    const hh=String(Math.floor(m/60)).padStart(2,'0'), mm=String(m%60).padStart(2,'0');
    const startsAt=`${av.date}T${hh}:${mm}:00-04:00`;
    const taken=appointments.some(a=>a.doctorSlug===av.doctorSlug && !['CANCELLED','PAYMENT_REJECTED'].includes(a.status) && a.startsAt===startsAt);
    out.push({time:`${hh}:${mm}`,available:!taken,startsAt});
  }
  return out;
}
