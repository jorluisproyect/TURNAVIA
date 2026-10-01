import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';
import { sendPushToAuthUser } from '@/lib/push';
import { ensureAppointmentEnhancements } from '@/lib/booking-payments';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  if(!sql)return NextResponse.json({ok:false,error:'DB_UNAVAILABLE'},{status:503});

  const secret=String(process.env.CRON_SECRET||'').trim();
  if(secret){
    const auth=String(req.headers.get('authorization')||'');
    if(auth!==`Bearer ${secret}`)return NextResponse.json({error:'No autorizado'},{status:401});
  }

  await ensureAppointmentEnhancements();

  const rows=await sql`SELECT a.id,a.starts_at,a.service_name,
      COALESCE(a.location_name_snapshot,l.name) AS location_name,
      COALESCE(a.location_address_snapshot,l.address) AS location_address,
      p.full_name AS client_name,p.email AS client_email,p.auth_user_id,
      u.full_name AS provider_name
    FROM appointments a
    JOIN patients p ON p.id=a.patient_id
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users u ON u.id=d.user_id
    LEFT JOIN locations l ON l.id=a.location_id
    WHERE a.reminder_15_sent_at IS NULL
      AND a.status IN ('CONFIRMED','ON_THE_WAY')
      AND a.starts_at>now()+interval '9 minutes'
      AND a.starts_at<=now()+interval '20 minutes'
    ORDER BY a.starts_at
    LIMIT 80`;

  let sent=0;
  let pending=0;

  for(const row of rows as any[]){
    const id=String(row.id);
    const when=new Date(row.starts_at).toLocaleString('es-VE',{
      weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit',
      timeZone:'America/Caracas'
    });
    const location=[row.location_name,row.location_address].filter(Boolean).join(' · ')||'Ubicación por confirmar';
    const clientName=String(row.client_name||'');
    const providerName=String(row.provider_name||'');
    const serviceName=String(row.service_name||'Servicio');
    const clientEmail=String(row.client_email||'').trim();
    const authUserId=String(row.auth_user_id||'').trim();

    let delivered=false;

    if(clientEmail){
      const mail=await sendTransactionalEmail({
        to:clientEmail,
        subject:'Tu cita TUCITA comienza en 15 minutos',
        html:tucitaEmail('Tu cita está por comenzar',`<p>Hola <strong>${clientName}</strong>.</p><p>Tu cita está programada para dentro de aproximadamente <strong>15 minutos</strong>.</p><p><strong>Servicio:</strong> ${serviceName}<br/><strong>Con:</strong> ${providerName}<br/><strong>Hora:</strong> ${when}<br/><strong>Lugar:</strong> ${location}</p><p>Si ya vas en camino, abre TUCITA para revisar tu reserva.</p>`)
      });
      delivered=delivered||Boolean(mail.ok);
    }

    if(authUserId){
      const push=await sendPushToAuthUser(authUserId,{
        title:'TUCITA · Tu cita es en 15 min',
        body:`${serviceName} con ${providerName}. ${location}`,
        url:'/paciente'
      });
      delivered=delivered||Boolean((push as any)?.ok);
      try{
        await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
          VALUES(${authUserId},'INFO','Tu cita es en 15 minutos',${serviceName+' con '+providerName+' · '+location},'/paciente')`;
        delivered=true;
      }catch{}
    }

    if(delivered||(!clientEmail&&!authUserId)){
      await sql`UPDATE appointments SET reminder_15_sent_at=now() WHERE id=${id}::uuid AND reminder_15_sent_at IS NULL`;
      sent++;
    }else{
      pending++;
    }
  }

  return NextResponse.json({ok:true,checked:rows.length,sent,pending});
}
