import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isMasterSession, validUuid } from '@/lib/access';
import { sendTransactionalEmail, tucitaEmail } from '@/lib/email';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!sql) return NextResponse.json({error:'Base de datos no disponible'},{status:503});
  if(!(await isMasterSession())) return NextResponse.json({error:'No autorizado'},{status:403});

  const body=await req.json();
  const id=String(body.id||'');
  const kind=body.kind==='welcome'?'welcome':'activation';
  if(!validUuid(id)) return NextResponse.json({error:'Cliente inválido'},{status:400});

  const rows=await sql`SELECT * FROM commercial_clients WHERE id=${id}::uuid LIMIT 1`;
  const client=rows[0] as any;
  if(!client) return NextResponse.json({error:'Cliente no encontrado'},{status:404});

  const linkRows=await sql`SELECT d.public_slug,o.slug AS organization_slug
    FROM users u
    JOIN doctors d ON d.user_id=u.id
    LEFT JOIN organizations o ON o.id=u.organization_id
    WHERE lower(u.email)=lower(${client.email})
    ORDER BY u.created_at
    LIMIT 1`;
  const linkRow=linkRows[0] as any;
  const appUrl=process.env.APP_URL||'https://tucita.com.ve';
  const publicPath=linkRow?.organization_slug?'/negocio/'+linkRow.organization_slug:linkRow?.public_slug?'/reservar/'+linkRow.public_slug:'';

  const mail=kind==='welcome'
    ? await sendTransactionalEmail({
        to:client.email,
        subject:'Tu cuenta TUCITA fue creada',
        html:tucitaEmail('Bienvenido a TUCITA',`<p>Hola <strong>${client.name}</strong>.</p><p>Tu cuenta TUCITA está creada.</p><p><strong>Usuario:</strong> ${client.email}</p><p>Por seguridad, tu contraseña no se envía por correo.</p>${publicPath?`<p><strong>Tu enlace público personalizado:</strong><br/><a href="${appUrl}${publicPath}">${appUrl}${publicPath}</a></p>`:''}<p><a href="${appUrl}/ingresar">Entrar a TUCITA</a></p>`)
      })
    : await sendTransactionalEmail({
        to:client.email,
        subject:'Tu cuenta TUCITA está activa',
        html:tucitaEmail('Tu cuenta TUCITA está activa',`<p>Hola <strong>${client.name}</strong>.</p><p>Tu cuenta está <strong>ACTIVA</strong> y lista para operar.</p>${publicPath?`<p><strong>Tu enlace público personalizado:</strong><br/><a href="${appUrl}${publicPath}">${appUrl}${publicPath}</a></p><p>Compártelo con tus clientes para recibir reservas.</p>`:''}<p><a href="${appUrl}/ingresar">Ingresar a TUCITA</a></p>`)
      });

  try{
    await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
      VALUES(${mail.ok?(kind==='welcome'?'WELCOME_EMAIL_SENT':'ACTIVATION_EMAIL_SENT'):(kind==='welcome'?'WELCOME_EMAIL_FAILED':'ACTIVATION_EMAIL_FAILED')},
      'COMMERCIAL_CLIENT',${id},jsonb_build_object('to',${client.email},'manualRetry',true,'error',${mail.error||null}))`;
  }catch(error){console.error('TUCITA manual email audit error',error)}

  if(!mail.ok) return NextResponse.json({error:mail.error||'No se pudo enviar el correo.'},{status:502});
  return NextResponse.json({ok:true});
}
