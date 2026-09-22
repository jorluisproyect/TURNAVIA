type MailAttachment={filename:string;content:string};
type MailArgs={to:string;subject:string;html:string;attachments?:MailAttachment[];replyTo?:string};
type MailResult={ok:boolean;skipped?:boolean;status?:number;error?:string};

export async function sendTransactionalEmail({to,subject,html,attachments=[],replyTo}:MailArgs):Promise<MailResult>{
  const key=process.env.RESEND_API_KEY;
  const configuredFrom=process.env.EMAIL_FROM;
  const from=configuredFrom || (process.env.NODE_ENV==='production'?'':'TUCITA <onboarding@resend.dev>');
  const configuredReplyTo=replyTo||process.env.EMAIL_REPLY_TO||'';

  if(!key){
    console.warn('TUCITA email skipped: RESEND_API_KEY is not configured', {to,subject});
    return {ok:false,skipped:true,error:'RESEND_API_KEY no configurada'};
  }
  if(!from){
    console.warn('TUCITA email skipped: EMAIL_FROM is not configured', {to,subject});
    return {ok:false,skipped:true,error:'EMAIL_FROM no configurado'};
  }

  try{
    const r=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[to],subject,html,attachments,...(configuredReplyTo?{reply_to:configuredReplyTo}:{})}),
      signal:AbortSignal.timeout(8000),
    });
    if(!r.ok){
      const raw=await r.text();
      console.error('TUCITA email error', raw);
      let message=raw;
      try{
        const parsed=JSON.parse(raw);
        message=String(parsed?.message||raw);
      }catch{}
      if(r.status===403 && /only send testing emails|verify a domain/i.test(message)){
        message='Resend está en modo de prueba. Verifica un dominio propio en Resend y configura EMAIL_FROM con una dirección de ese dominio para enviar correos a clientes.';
      }
      return {ok:false,status:r.status,error:message};
    }
    return {ok:true,status:r.status};
  }catch(error){
    const message=error instanceof Error?error.message:'Error de transporte';
    console.error('TUCITA email transport error', error);
    return {ok:false,error:message};
  }
}

export function tucitaEmail(title:string,body:string){
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5fbf9;padding:24px;color:#173b37"><div style="max-width:620px;margin:auto;background:white;border:1px solid #d8e8e4;border-radius:18px;padding:28px"><div style="font-weight:800;color:#0f766e;font-size:20px">TUCITA</div><h1 style="font-size:24px">${title}</h1><div style="line-height:1.6">${body}</div><p style="color:#607873;font-size:12px;margin-top:24px">TUCITA · Tu servicio, a tu hora.</p></div></body></html>`;
}
