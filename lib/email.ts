type MailAttachment={filename:string;content:string};
type MailArgs={to:string;subject:string;html:string;attachments?:MailAttachment[];replyTo?:string};
type MailResult={ok:boolean;skipped?:boolean;status?:number;error?:string;transport?:'smtp'|'resend'};

function smtpConfig(){
  const host=process.env.SMTP_HOST;
  const user=process.env.SMTP_USER;
  const pass=process.env.SMTP_PASS;
  const port=Number(process.env.SMTP_PORT||465);
  if(!host||!user||!pass)return null;
  return {host,user,pass,port,secure:String(process.env.SMTP_SECURE??'true').toLowerCase()!=='false'};
}

async function sendWithSmtp({to,subject,html,attachments=[],replyTo}:MailArgs):Promise<MailResult>{
  const cfg=smtpConfig();
  if(!cfg)return {ok:false,skipped:true,error:'SMTP no configurado'};
  // nodemailer is CommonJS and is used only in the Node.js runtime.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer:any=require('nodemailer');
  const from=process.env.EMAIL_FROM||`TUCITA <${cfg.user}>`;
  const configuredReplyTo=replyTo||process.env.EMAIL_REPLY_TO||'';
  const transporter=nodemailer.createTransport({
    host:cfg.host,
    port:cfg.port,
    secure:cfg.secure,
    auth:{user:cfg.user,pass:cfg.pass},
    connectionTimeout:10000,
    greetingTimeout:10000,
    socketTimeout:20000,
  });
  let lastError:unknown;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
        ...(configuredReplyTo?{replyTo:configuredReplyTo}:{}),
        attachments:attachments.map(a=>({filename:a.filename,content:Buffer.from(a.content,'base64')})),
      });
      return {ok:true,status:250,transport:'smtp'};
    }catch(error){
      lastError=error;
      const code=String((error as any)?.code||'');
      const transient=['EBUSY','EAI_AGAIN','ETIMEDOUT','ECONNRESET'].includes(code);
      console.error(`TUCITA SMTP email error (attempt ${attempt})`,error);
      if(!transient||attempt===3)break;
      await new Promise(resolve=>setTimeout(resolve,700*attempt));
    }
  }
  const message=lastError instanceof Error?lastError.message:'Error SMTP';
  return {ok:false,error:message,transport:'smtp'};
}

async function sendWithResend({to,subject,html,attachments=[],replyTo}:MailArgs):Promise<MailResult>{
  const key=process.env.RESEND_API_KEY;
  const configuredFrom=process.env.EMAIL_FROM;
  const from=configuredFrom || (process.env.NODE_ENV==='production'?'':'TUCITA <onboarding@resend.dev>');
  const configuredReplyTo=replyTo||process.env.EMAIL_REPLY_TO||'';

  if(!key)return {ok:false,skipped:true,error:'RESEND_API_KEY no configurada'};
  if(!from)return {ok:false,skipped:true,error:'EMAIL_FROM no configurado'};
  try{
    const r=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[to],subject,html,attachments,...(configuredReplyTo?{reply_to:configuredReplyTo}:{})}),
      signal:AbortSignal.timeout(8000),
    });
    if(!r.ok){
      const raw=await r.text();
      let message=raw;
      try{message=String(JSON.parse(raw)?.message||raw)}catch{}
      return {ok:false,status:r.status,error:message,transport:'resend'};
    }
    return {ok:true,status:r.status,transport:'resend'};
  }catch(error){
    const message=error instanceof Error?error.message:'Error de transporte';
    return {ok:false,error:message,transport:'resend'};
  }
}

export async function sendTransactionalEmail(args:MailArgs):Promise<MailResult>{
  const smtp=smtpConfig();
  if(smtp){
    const result=await sendWithSmtp(args);
    if(result.ok)return result;
    // SMTP is the primary transport for TUCITA. Resend fallback is opt-in only.
    if(process.env.EMAIL_FALLBACK_RESEND==='true'&&process.env.RESEND_API_KEY){
      console.warn('TUCITA SMTP failed; attempting Resend fallback',result.error);
      const fallback=await sendWithResend(args);
      if(fallback.ok)return fallback;
      return {
        ok:false,
        status:fallback.status,
        transport:'smtp',
        error:`SMTP falló: ${result.error||'error desconocido'}. Resend de respaldo también falló: ${fallback.error||'error desconocido'}`
      };
    }
    return result;
  }
  return sendWithResend(args);
}

export function tucitaEmail(title:string,body:string){
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5fbf9;padding:24px;color:#173b37"><div style="max-width:620px;margin:auto;background:white;border:1px solid #d8e8e4;border-radius:18px;padding:28px"><div style="font-weight:800;color:#0f766e;font-size:20px">TUCITA</div><h1 style="font-size:24px">${title}</h1><div style="line-height:1.6">${body}</div><p style="color:#607873;font-size:12px;margin-top:24px">TUCITA · Tu servicio, a tu hora.</p></div></body></html>`;
}
