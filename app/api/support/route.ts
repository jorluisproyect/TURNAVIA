import { NextResponse } from 'next/server';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const SUPPORT_EMAIL='soporte@tucita.com.ve';

function esc(value:string){
  return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch));
}

export async function POST(req:Request){
  const body=await req.json().catch(()=>({}));
  if(String(body.website||''))return NextResponse.json({ok:true});
  const name=String(body.name||'').trim().slice(0,120);
  const email=String(body.email||'').trim().toLowerCase().slice(0,320);
  const subject=String(body.subject||'Soporte TUCITA').trim().slice(0,120);
  const message=String(body.message||'').trim().slice(0,2000);
  if(!name||!/^\S+@\S+\.\S+$/.test(email)||message.length<10){
    return NextResponse.json({error:'Completa nombre, correo y mensaje.'},{status:400});
  }

  const result=await sendTransactionalEmail({
    to:SUPPORT_EMAIL,
    replyTo:email,
    subject:'[TUCITA] '+subject,
    html:tucitaEmail('Nuevo mensaje de soporte',`<p><strong>De:</strong> ${esc(name)}<br/><strong>Correo:</strong> ${esc(email)}<br/><strong>Motivo:</strong> ${esc(subject)}</p><p style="white-space:pre-wrap">${esc(message)}</p>`)
  });

  return result.ok
    ?NextResponse.json({ok:true})
    :NextResponse.json({error:'No pudimos confirmar el envío. Intenta nuevamente.'},{status:502});
}
