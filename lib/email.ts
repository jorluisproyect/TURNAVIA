type MailArgs={to:string;subject:string;html:string};

export async function sendTransactionalEmail({to,subject,html}:MailArgs){
  const key=process.env.RESEND_API_KEY;
  const from=process.env.EMAIL_FROM || 'TURNAVIA <onboarding@resend.dev>';
  if(!key){
    console.warn('TURNAVIA email skipped: RESEND_API_KEY is not configured', {to,subject});
    return {ok:false,skipped:true};
  }
  const r=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({from,to:[to],subject,html}),
  });
  if(!r.ok){
    console.error('TURNAVIA email error', await r.text());
    return {ok:false};
  }
  return {ok:true};
}

export function turnaviaEmail(title:string,body:string){
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f5fbf9;padding:24px;color:#173b37"><div style="max-width:620px;margin:auto;background:white;border:1px solid #d8e8e4;border-radius:18px;padding:28px"><div style="font-weight:800;color:#0f766e;font-size:20px">TURNAVIA</div><h1 style="font-size:24px">${title}</h1><div style="line-height:1.6">${body}</div><p style="color:#607873;font-size:12px;margin-top:24px">TURNAVIA · Tu consulta, a tu hora.</p></div></body></html>`;
}
