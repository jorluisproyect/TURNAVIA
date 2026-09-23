import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { convertMoney, getFxSnapshot } from '@/lib/currency';

export const dynamic='force-dynamic';
export const runtime='nodejs';

function weekStart(d:Date){
  const x=new Date(d);
  const day=x.getUTCDay();
  const diff=(day+6)%7;
  x.setUTCDate(x.getUTCDate()-diff);
  x.setUTCHours(0,0,0,0);
  return x;
}
function moneyUsd(amount:number,currency:string,rates:Record<string,number>){
  return convertMoney(amount,currency,'USD',rates)??0;
}

export async function GET(){
  if(!sql)return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  const {data:session}=await auth.getSession();
  if(!session?.user)return NextResponse.json({error:'No autorizado'},{status:401});
  const email=String((session.user as any).email||'').toLowerCase();
  const providers=await sql`SELECT d.id,d.public_slug,d.provider_activity,u.full_name
    FROM users u JOIN doctors d ON d.user_id=u.id
    WHERE lower(u.email)=lower(${email}) LIMIT 1`;
  const provider=providers[0] as any;
  if(!provider)return NextResponse.json({error:'Perfil profesional no encontrado'},{status:404});

  const rows=await sql`SELECT a.id,a.starts_at,a.status,a.service_name,a.consultation_price,a.consultation_currency,
      a.payment_method,a.payment_reference,a.payment_submitted_at,a.payment_approved_at,a.completed_at,
      p.full_name AS client_name
    FROM appointments a
    JOIN patients p ON p.id=a.patient_id
    WHERE a.doctor_id=${provider.id}
    ORDER BY a.starts_at DESC
    LIMIT 500`;

  const fx=await getFxSnapshot();
  const rates=fx.rates as Record<string,number>;
  const now=Date.now();
  const currentWeek=weekStart(new Date()).getTime();
  const nextWeek=currentWeek+7*86400000;

  let weekPaidUsd=0, scheduledUsd=0, paidUsd=0, reviewUsd=0;
  const history=(rows as any[]).map(r=>{
    const amount=Number(r.consultation_price||0);
    const currency=String(r.consultation_currency||'USD').toUpperCase();
    const usd=moneyUsd(amount,currency,rates);
    const ts=new Date(r.starts_at).getTime();
    const status=String(r.status||'');
    const paid=Boolean(r.payment_approved_at)||status==='COMPLETED';
    const activeFuture=ts>=now&&!['CANCELLED','PAYMENT_REJECTED'].includes(status);
    if(paid)paidUsd+=usd;
    if(activeFuture)scheduledUsd+=usd;
    if(paid&&ts>=currentWeek&&ts<nextWeek)weekPaidUsd+=usd;
    if(status==='PAYMENT_REVIEW')reviewUsd+=usd;
    return {
      id:String(r.id),startsAt:new Date(r.starts_at).toISOString(),status,serviceName:r.service_name||'Servicio',
      amount,currency,usd,clientName:r.client_name||'Cliente',paymentMethod:r.payment_method||'',
      paymentReference:r.payment_reference||'',paid,paymentApprovedAt:r.payment_approved_at?new Date(r.payment_approved_at).toISOString():null,
      completedAt:r.completed_at?new Date(r.completed_at).toISOString():null
    };
  });

  const weekly:any[]=[];
  const anchor=weekStart(new Date());
  for(let i=7;i>=0;i--){
    const start=new Date(anchor.getTime()-i*7*86400000);
    const end=new Date(start.getTime()+7*86400000);
    const relevant=history.filter(h=>{
      const t=new Date(h.startsAt).getTime();
      return h.paid&&t>=start.getTime()&&t<end.getTime();
    });
    weekly.push({
      start:start.toISOString(),
      label:start.toLocaleDateString('es-VE',{day:'2-digit',month:'short',timeZone:'UTC'}),
      amountUsd:relevant.reduce((s,x)=>s+x.usd,0),
      appointments:relevant.length
    });
  }

  const upcoming=history.filter(h=>new Date(h.startsAt).getTime()>=now&&!['CANCELLED','PAYMENT_REJECTED'].includes(h.status)).slice(0,20);

  return NextResponse.json({
    provider:{name:provider.full_name,activity:provider.provider_activity||'Profesional'},
    summary:{weekPaidUsd,scheduledUsd,paidUsd,reviewUsd,appointments:history.length},
    weekly,
    upcoming,
    history:history.slice(0,120),
    fx
  });
}
