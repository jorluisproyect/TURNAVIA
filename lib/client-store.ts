export type ClientStatus = 'TRIAL'|'PAGO_PENDIENTE'|'REVISION_BINANCE'|'ACTIVO'|'SUSPENDIDO';

export type Client = {
  id:string;
  name:string;
  type:string;
  specialty?:string;
  phone:string;
  email:string;
  status:ClientStatus;
  createdAt:string;
  trialEndsAt?:string;
  paymentMethod?:'PAYPAL'|'BINANCE';
  paymentReference?:string;
  paymentComment?:string;
  paypalOrderId?:string;
};

declare global {
  var __turnaviaClients: Client[] | undefined;
}

function seedClients(): Client[] {
  const now = new Date();
  const trial = new Date(now.getTime()+5*86400000).toISOString();
  return [
    {id:'c1',name:'Centro Médico Caracas',type:'Clínica / consultorio',phone:'0212-5550000',email:'demo@turnavia.app',status:'ACTIVO',createdAt:now.toISOString()},
    {id:'c2',name:'Dra. Sofía Mendoza',type:'Médico independiente',specialty:'Cardiología',phone:'0412-5550101',email:'sofia.demo@turnavia.app',status:'ACTIVO',createdAt:now.toISOString()},
    {id:'trial-demo',name:'Dr. Andrés Rivas',type:'Médico independiente',specialty:'Pediatría',phone:'0412-0000000',email:'andres@demo.turnavia.app',status:'TRIAL',createdAt:now.toISOString(),trialEndsAt:trial},
  ];
}

export const clients: Client[] = globalThis.__turnaviaClients ?? seedClients();
if(!globalThis.__turnaviaClients) globalThis.__turnaviaClients = clients;

export function getClient(id:string){
  return clients.find(c=>c.id===id);
}
