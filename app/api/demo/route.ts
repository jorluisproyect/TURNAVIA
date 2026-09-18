import { NextResponse } from 'next/server';
import { demoStore, makeSlots, resetDemoStore } from '@/lib/demo-store';
import { sql } from '@/lib/db';

const fallbackDoctor={slug:'sofia-mendoza',name:'Dra. Sofía Mendoza',initials:'SM',specialty:'Cardiología',location:'Centro Médico Caracas · Consultorio 204'};

async function dbDoctor(){
  if(!sql) return null;
  const rows=await sql`SELECT d.id,d.public_slug,d.consultation_price,d.consultation_currency,d.payment_instructions,u.full_name,d.specialty,l.id AS location_id,l.name AS location_name,l.address,dl.room
    FROM doctors d JOIN users u ON u.id=d.user_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=d.id LEFT JOIN locations l ON l.id=dl.location_id
    WHERE d.public_slug='sofia-mendoza' LIMIT 1`;
  return rows[0] as any || null;
}

async function dbSnapshot(){
  if(!sql) return null;
  const d=await dbDoctor();
  if(!d) return null;
  const avs=await sql`SELECT id, starts_at, ends_at, slot_minutes FROM availability_blocks WHERE doctor_id=${d.id} AND published=true ORDER BY starts_at`;
  const aps=await sql`SELECT a.id,a.starts_at,a.ends_at,a.status,a.reason_short,a.consultation_price,a.consultation_currency,a.payment_method,a.payment_reference,a.payment_proof_url,a.payment_submitted_at,a.payment_approved_at,a.reschedule_used,a.policy_accepted,p.full_name AS patient,p.national_id,p.phone
    FROM appointments a JOIN patients p ON p.id=a.patient_id WHERE a.doctor_id=${d.id} ORDER BY a.starts_at`;
  const statusRows=await sql`SELECT status,delay_minutes FROM doctor_status_updates WHERE doctor_id=${d.id} ORDER BY updated_at DESC LIMIT 1`;
  const appointments=aps.map((a:any)=>({id:String(a.id),doctorSlug:'sofia-mendoza',doctorName:d.full_name,patient:a.patient,nationalId:a.national_id||'',phone:a.phone,reason:a.reason_short||'',startsAt:new Date(a.starts_at).toISOString(),endsAt:new Date(a.ends_at).toISOString(),status:a.status,location:[d.location_name,d.room?`Consultorio ${d.room}`:''].filter(Boolean).join(' · '),consultationPrice:Number(a.consultation_price ?? d.consultation_price ?? 0),currency:a.consultation_currency||d.consultation_currency||'USD',paymentMethod:a.payment_method||'',paymentReference:a.payment_reference||'',paymentProofDataUrl:a.payment_proof_url||'',paymentSubmittedAt:a.payment_submitted_at?new Date(a.payment_submitted_at).toISOString():undefined,paymentApprovedAt:a.payment_approved_at?new Date(a.payment_approved_at).toISOString():undefined,rescheduleUsed:Boolean(a.reschedule_used),policyAccepted:Boolean(a.policy_accepted)}));
  const availability=avs.map((a:any)=>{
    const s=new Date(a.starts_at),e=new Date(a.ends_at); const date=s.toLocaleDateString('en-CA',{timeZone:'America/Caracas'}); const start=s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'}); const end=e.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Caracas'});
    const base={id:String(a.id),doctorSlug:'sofia-mendoza',date,start,end,slotMinutes:Number(a.slot_minutes),location:[d.location_name,d.room?`Consultorio ${d.room}`:''].filter(Boolean).join(' · ')};
    return {...base,slots:makeSlots(base as any,appointments as any)};
  });
  return {doctor:{slug:d.public_slug,name:d.full_name,initials:String(d.full_name).replace(/^(Dr\.?|Dra\.?)\s*/,'').split(' ').slice(0,2).map((x:string)=>x[0]).join(''),specialty:d.specialty,location:[d.location_name,d.room?`Consultorio ${d.room}`:''].filter(Boolean).join(' · ')},doctorStatus:(statusRows[0] as any)?.status||'NORMAL',delayMinutes:Number((statusRows[0] as any)?.delay_minutes||0),consultationPrice:Number(d.consultation_price||0),currency:d.consultation_currency||'USD',paymentInstructions:d.payment_instructions||'',availability,appointments};
}

function memSnapshot(){const availability=demoStore.availability.map(a=>({...a,slots:makeSlots(a)}));return {doctor:fallbackDoctor,doctorStatus:demoStore.doctorStatus,delayMinutes:demoStore.delayMinutes,consultationPrice:demoStore.consultationPrice,currency:demoStore.currency,paymentInstructions:demoStore.paymentInstructions,availability,appointments:[...demoStore.appointments].sort((a,b)=>a.startsAt.localeCompare(b.startsAt))}}
async function snapshot(){try{return (await dbSnapshot())||memSnapshot()}catch(e){console.error('Turnavia DB fallback',e);return memSnapshot()}}
export async function GET(){return NextResponse.json(await snapshot())}

export async function POST(req:Request){
  const body=await req.json();
  if(body.action==='reset_demo'){ resetDemoStore(); return NextResponse.json({ok:true,state:await snapshot()}); }
  if(sql){
    try{
      const doc=await dbDoctor();
      if(doc){
        if(body.action==='book'){
          const taken=await sql`SELECT id FROM appointments WHERE doctor_id=${doc.id} AND starts_at=${body.startsAt}::timestamptz AND status NOT IN ('CANCELLED','PAYMENT_REJECTED') LIMIT 1`;
          if(taken.length)return NextResponse.json({error:'Ese horario acaba de ser reservado. Elige otro.'},{status:409});
          let patients=await sql`SELECT id FROM patients WHERE phone=${body.phone} LIMIT 1`;
          let patientId:any;
          if(patients.length) patientId=(patients[0] as any).id; else {const p=await sql`INSERT INTO patients(full_name,national_id,phone) VALUES(${body.patient},${body.nationalId||null},${body.phone}) RETURNING id`;patientId=(p[0] as any).id}
          await sql`INSERT INTO appointments(doctor_id,patient_id,location_id,starts_at,ends_at,status,source,reason_short,consultation_price,consultation_currency,payment_method,payment_reference,payment_proof_url,payment_submitted_at,reschedule_used,policy_accepted)
            VALUES(${doc.id},${patientId},${doc.location_id},${body.startsAt}::timestamptz,${body.startsAt}::timestamptz + interval '30 minutes','PAYMENT_REVIEW','PATIENT_WEB',${body.reason||null},${Number(doc.consultation_price||0)},${doc.consultation_currency||'USD'},${body.paymentMethod||null},${body.paymentReference||null},${body.paymentProofDataUrl||null},now(),false,${Boolean(body.policyAccepted)})`;
          return NextResponse.json({ok:true,state:await snapshot()});
        }
        if(body.action==='approve_payment'){await sql`UPDATE appointments SET status='CONFIRMED',payment_approved_at=now() WHERE id=${body.id}::uuid`;return NextResponse.json({ok:true,state:await snapshot()})}
        if(body.action==='reject_payment'){await sql`UPDATE appointments SET status='PAYMENT_REJECTED' WHERE id=${body.id}::uuid`;return NextResponse.json({ok:true,state:await snapshot()})}
        if(body.action==='doctor_settings'){await sql`UPDATE doctors SET consultation_price=${Number(body.consultationPrice||0)},consultation_currency=${body.currency||'USD'},payment_instructions=${body.paymentInstructions||''} WHERE id=${doc.id}`;return NextResponse.json({ok:true,state:await snapshot()})}
        if(body.action==='reschedule_once'){
          const rows=await sql`SELECT reschedule_used FROM appointments WHERE id=${body.id}::uuid LIMIT 1`;
          if(!rows.length)return NextResponse.json({error:'Cita no encontrada'},{status:404});
          if(Boolean((rows[0] as any).reschedule_used))return NextResponse.json({error:'La reprogramación permitida ya fue utilizada.'},{status:409});
          await sql`UPDATE appointments SET starts_at=${body.startsAt}::timestamptz,ends_at=${body.startsAt}::timestamptz + interval '30 minutes',reschedule_used=true,status='CONFIRMED' WHERE id=${body.id}::uuid`;
          return NextResponse.json({ok:true,state:await snapshot()});
        }
        if(body.action==='appointment_status'){await sql`UPDATE appointments SET status=${body.status}::appointment_status WHERE id=${body.id}::uuid`;return NextResponse.json({ok:true,state:await snapshot()})}
        if(body.action==='doctor_status'){await sql`INSERT INTO doctor_status_updates(doctor_id,work_date,status,delay_minutes) VALUES(${doc.id},current_date,${body.status}::doctor_day_status,${Number(body.delayMinutes||0)}) ON CONFLICT(doctor_id,work_date) DO UPDATE SET status=EXCLUDED.status,delay_minutes=EXCLUDED.delay_minutes,updated_at=now()`;return NextResponse.json({ok:true,state:await snapshot()})}
        if(body.action==='add_availability'){await sql`INSERT INTO availability_blocks(doctor_id,location_id,starts_at,ends_at,slot_minutes,published) VALUES(${doc.id},${doc.location_id},(${body.date}||' '||${body.start}||' America/Caracas')::timestamptz,(${body.date}||' '||${body.end}||' America/Caracas')::timestamptz,${Number(body.slotMinutes||30)},true)`;return NextResponse.json({ok:true,state:await snapshot()})}
      }
    }catch(e){console.error('Turnavia DB action failed, using demo memory',e)}
  }
  if(body.action==='book'){
    const exists=demoStore.appointments.some(a=>a.startsAt===body.startsAt&&!['CANCELLED','PAYMENT_REJECTED'].includes(a.status)); if(exists)return NextResponse.json({error:'Ese horario acaba de ser reservado. Elige otro.'},{status:409});
    const start=new Date(body.startsAt);const end=new Date(start.getTime()+30*60000);demoStore.appointments.push({id:`p${Date.now()}`,doctorSlug:'sofia-mendoza',doctorName:'Dra. Sofía Mendoza',patient:body.patient,nationalId:body.nationalId,phone:body.phone,reason:body.reason||'',startsAt:body.startsAt,endsAt:end.toISOString(),status:'PAYMENT_REVIEW',location:'Centro Médico Caracas · Consultorio 204',consultationPrice:demoStore.consultationPrice,currency:demoStore.currency,paymentMethod:body.paymentMethod||'',paymentReference:body.paymentReference||'',paymentProofName:body.paymentProofName||'',paymentProofDataUrl:body.paymentProofDataUrl||'',paymentSubmittedAt:new Date().toISOString(),rescheduleUsed:false,policyAccepted:Boolean(body.policyAccepted)});return NextResponse.json({ok:true,state:await snapshot()});
  }
  if(body.action==='approve_payment'){const ap=demoStore.appointments.find(a=>a.id===body.id);if(!ap)return NextResponse.json({error:'Cita no encontrada'},{status:404});ap.status='CONFIRMED';ap.paymentApprovedAt=new Date().toISOString();return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='reject_payment'){const ap=demoStore.appointments.find(a=>a.id===body.id);if(!ap)return NextResponse.json({error:'Cita no encontrada'},{status:404});ap.status='PAYMENT_REJECTED';return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='doctor_settings'){demoStore.consultationPrice=Number(body.consultationPrice||0);demoStore.currency=body.currency||'USD';demoStore.paymentInstructions=body.paymentInstructions||demoStore.paymentInstructions;return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='reschedule_once'){const ap=demoStore.appointments.find(a=>a.id===body.id);if(!ap)return NextResponse.json({error:'Cita no encontrada'},{status:404});if(ap.rescheduleUsed)return NextResponse.json({error:'La reprogramación permitida ya fue utilizada.'},{status:409});ap.startsAt=body.startsAt;ap.endsAt=new Date(new Date(body.startsAt).getTime()+30*60000).toISOString();ap.rescheduleUsed=true;ap.status='CONFIRMED';return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='appointment_status'){const ap=demoStore.appointments.find(a=>a.id===body.id);if(!ap)return NextResponse.json({error:'Cita no encontrada'},{status:404});ap.status=body.status;return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='doctor_status'){demoStore.doctorStatus=body.status;demoStore.delayMinutes=Number(body.delayMinutes||0);return NextResponse.json({ok:true,state:await snapshot()})}
  if(body.action==='add_availability'){demoStore.availability.push({id:`a${Date.now()}`,doctorSlug:'sofia-mendoza',date:body.date,start:body.start,end:body.end,slotMinutes:Number(body.slotMinutes||30),location:'Centro Médico Caracas · Consultorio 204'});return NextResponse.json({ok:true,state:await snapshot()})}
  return NextResponse.json({error:'Acción inválida'},{status:400});
}
