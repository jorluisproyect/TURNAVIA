import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sql } from '@/lib/db';
// qrcode ships CommonJS and works in the Node.js runtime used by TUCITA.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCode:any=require('qrcode');

function clean(v:any){return String(v??'').replace(/[\r\n]+/g,' ').trim()}
function line(page:any,font:any,bold:any,label:string,value:string,y:number){
  page.drawText(label,{x:54,y,size:10,font:bold,color:rgb(.06,.46,.43)});
  page.drawText(value||'—',{x:178,y,size:10,font,color:rgb(.09,.23,.22)});
}

export async function appointmentReceiptData(appointmentId:string){
  if(!sql)return null;
  const rows=await sql`SELECT
      a.id,a.receipt_number,a.checkin_token,a.starts_at,a.ends_at,a.status,a.service_name,
      a.consultation_price,a.consultation_currency,a.payment_method,a.payment_reference,a.payment_approved_at,
      a.location_name_snapshot,a.location_address_snapshot,a.location_city_snapshot,a.location_state_snapshot,a.location_country_snapshot,a.location_room_snapshot,
      p.full_name AS client_name,p.email AS client_email,p.phone AS client_phone,
      u.full_name AS provider_name,u.email AS provider_email,
      l.name AS current_location_name,l.address AS current_location_address,l.city AS current_location_city,l.state AS current_location_state,l.country AS current_location_country,
      dl.room AS current_room
    FROM appointments a
    JOIN patients p ON p.id=a.patient_id
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users u ON u.id=d.user_id
    LEFT JOIN locations l ON l.id=a.location_id
    LEFT JOIN doctor_locations dl ON dl.doctor_id=a.doctor_id AND dl.location_id=a.location_id
    WHERE a.id=${appointmentId}::uuid LIMIT 1`;
  const r=rows[0] as any;
  if(!r)return null;
  const locationName=clean(r.location_name_snapshot||r.current_location_name);
  const address=[r.location_address_snapshot||r.current_location_address,r.location_city_snapshot||r.current_location_city,r.location_state_snapshot||r.current_location_state,r.location_country_snapshot||r.current_location_country].filter(Boolean).map(clean).join(' · ');
  const room=clean(r.location_room_snapshot||r.current_room);
  const appUrl=process.env.APP_URL||'https://tucita.com.ve';
  return {...r,locationName,address,room,checkinUrl:`${appUrl}/checkin/${encodeURIComponent(String(r.checkin_token))}`};
}

export async function buildAppointmentReceiptPdf(appointmentId:string){
  const r=await appointmentReceiptData(appointmentId);
  if(!r)throw new Error('Cita no encontrada');
  const pdf=await PDFDocument.create();
  const page=pdf.addPage([595.28,841.89]);
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({x:0,y:760,width:595.28,height:81,color:rgb(.04,.47,.43)});
  page.drawText('TUCITA',{x:52,y:800,size:25,font:bold,color:rgb(1,1,1)});
  page.drawText('Tu servicio, a tu hora.',{x:52,y:780,size:10,font,color:rgb(.9,1,.98)});
  page.drawText('RECIBO DE CITA / COMPROBANTE DE PAGO',{x:52,y:724,size:15,font:bold,color:rgb(.07,.25,.24)});
  page.drawText(clean(r.receipt_number),{x:52,y:703,size:11,font:bold,color:rgb(.04,.47,.43)});
  const when=new Date(r.starts_at).toLocaleString('es-VE',{dateStyle:'full',timeStyle:'short',timeZone:'America/Caracas'});
  line(page,font,bold,'Cliente',clean(r.client_name),665);
  line(page,font,bold,'Profesional / negocio',clean(r.provider_name),643);
  line(page,font,bold,'Servicio',clean(r.service_name||'Servicio'),621);
  line(page,font,bold,'Fecha y hora',when,599);
  line(page,font,bold,'Lugar',clean(r.locationName),577);
  line(page,font,bold,'Dirección',clean(r.address),555);
  if(r.room)line(page,font,bold,'Referencia del lugar',clean(r.room),533);
  line(page,font,bold,'Monto',`${clean(r.consultation_currency||'USD')} ${Number(r.consultation_price||0).toFixed(2)}`,511);
  line(page,font,bold,'Método de pago',clean(r.payment_method),489);
  line(page,font,bold,'Referencia',clean(r.payment_reference),467);
  line(page,font,bold,'Estado','CONFIRMADA / PAGO APROBADO',445);

  const qrData=await QRCode.toDataURL(r.checkinUrl,{margin:1,width:320,errorCorrectionLevel:'M'});
  const png=Buffer.from(String(qrData).split(',')[1],'base64');
  const qr=await pdf.embedPng(png);
  page.drawRectangle({x:50,y:160,width:495,height:240,borderColor:rgb(.82,.9,.88),borderWidth:1,color:rgb(.98,1,1)});
  page.drawText('Código QR de la cita',{x:78,y:370,size:13,font:bold,color:rgb(.07,.25,.24)});
  page.drawText('Preséntalo al llegar. Recepción o el profesional registrará tu asistencia.',{x:78,y:350,size:9,font,color:rgb(.3,.4,.39)});
  page.drawImage(qr,{x:78,y:188,width:145,height:145});
  page.drawText(clean(r.receipt_number),{x:250,y:280,size:12,font:bold,color:rgb(.04,.47,.43)});
  page.drawText('Check-in seguro TUCITA',{x:250,y:257,size:10,font,color:rgb(.09,.23,.22)});
  page.drawText('El primer registro marca llegada; el cierre del servicio marca la cita completada.',{x:250,y:234,size:8,font,color:rgb(.32,.4,.39),maxWidth:260});
  page.drawText('Este documento es un recibo/comprobante de TUCITA y no sustituye una factura fiscal.',{x:52,y:102,size:8,font,color:rgb(.4,.46,.45)});
  page.drawText('tucita.com.ve',{x:52,y:82,size:9,font:bold,color:rgb(.04,.47,.43)});
  const bytes=await pdf.save();
  return {buffer:Buffer.from(bytes),data:r};
}
