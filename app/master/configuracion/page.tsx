import { isOwnerMasterSession } from '@/lib/access';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
import { hasDatabase, sql, databaseEnvName } from '@/lib/db';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { neonAuthConfigured } from '@/lib/auth/config';
import EmailTestButton from './EmailTestButton';
import ResetTucitaDataButton from './ResetTucitaDataButton';
import FreeEmailTool from './FreeEmailTool';

export const dynamic='force-dynamic';

function State({ok,label}:{ok:boolean;label:string}){
 return <div className="notice row" style={{gap:9}}>{ok?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}<span><strong>{label}</strong><br/><small className="muted">{ok?'Configurado':'Requiere configuración'}</small></span></div>;
}

export default async function ConfiguracionMaster(){
  if(!(await isOwnerMasterSession()))redirect('/master');
 const authReady=neonAuthConfigured;
 const appUrlReady=Boolean(process.env.APP_URL);
 const smtpReady=Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASS);
 const resendReady=Boolean(process.env.RESEND_API_KEY);
 const emailFromReady=Boolean(process.env.EMAIL_FROM);
 const emailReady=emailFromReady&&(smtpReady||resendReady);
 const cookieReady=Boolean(process.env.NEON_AUTH_COOKIE_SECRET);
 let databaseReachable=false;
 if(sql){try{const rows=await sql`SELECT 1 AS ok`;databaseReachable=Number((rows[0] as any)?.ok||0)===1}catch{databaseReachable=false}}

 return <div className="dashboard"><Sidebar role="master"/><main className="main">
  <div className="topbar"><div><div className="muted" style={{fontSize:13}}>TUCITA · Producción</div><h1>Configuración</h1></div><span className="pill"><ShieldCheck size={14}/> Solo Master</span></div>

  <section className="panel">
    <h2>Estado del sistema</h2>
    <p className="muted">Esta sección no muestra claves; solo confirma si las conexiones necesarias existen en el servidor.</p>
    <div className="grid-3" style={{marginTop:14}}>
      <State ok={hasDatabase&&databaseReachable} label="Base de datos Neon"/>
      <State ok={authReady} label="Neon Auth"/>
      <State ok={cookieReady} label="Sesiones seguras"/>
      <State ok={appUrlReady} label="URL de producción"/>
      <State ok={emailReady} label="Correos transaccionales"/>
    </div>
    {!hasDatabase&&<div className="notice danger" style={{marginTop:14}}><strong>Falta conexión de base de datos en producción.</strong><br/>TUCITA busca <code>DATABASE_URL</code>, <code>POSTGRES_URL</code>, <code>NEON_DATABASE_URL</code> o sus variantes no-pooling. Hasta que una exista en Vercel, clientes, reservas, pagos y profesionales no podrán operar.</div>}
    {hasDatabase&&!databaseReachable&&<div className="notice danger" style={{marginTop:14}}><strong>La variable de base de datos existe pero Neon no responde.</strong><br/>Variable detectada: <code>{databaseEnvName||'desconocida'}</code>.</div>}
    {hasDatabase&&databaseReachable&&<div className="notice" style={{marginTop:14}}><strong>Neon conectado correctamente.</strong><br/>Variable detectada: <code>{databaseEnvName}</code>. El Master puede operar con datos reales.</div>}
    {!emailReady&&<div className="notice" style={{marginTop:14}}><strong>Correos de TUCITA pendientes.</strong><br/>Falta completar el remitente y al menos un transporte de correo.<br/><span className="muted">SMTP: {smtpReady?'OK':'FALTA'} · Resend respaldo: {resendReady?'OK':'NO CONFIGURADO'} · EMAIL_FROM: {emailFromReady?'OK':'FALTA'}</span></div>}
    {emailReady&&<div className="notice" style={{marginTop:14}}><div><strong>Prueba real de correo.</strong><br/><span className="muted">TUCITA intentará primero el SMTP de tu dominio. Si aún conservas Resend, solo se usará como respaldo si SMTP falla.</span><div style={{marginTop:10}}><EmailTestButton/></div></div></div>}
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Métodos para cobrar TUCITA</h2>
    <p className="muted">Estos métodos se usan para activaciones y mensualidades de profesionales y negocios.</p>
    <PaymentMethodsManager scope="MASTER"/>
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Modelo comercial</h2>
    <p className="muted">Profesional independiente: USD 25 activación + USD 15 primer mes. Negocio hasta 5 profesionales: USD 100 activación + USD 49 primer mes. Prueba gratuita: 15 días. La renovación mensual se controla desde Suscripciones.</p>
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Mantenimiento de cuentas</h2>
    <p className="muted">Herramientas para resolver cuentas antiguas sin afectar a otros usuarios.</p>
    <FreeEmailTool/>
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Zona de reinicio</h2>
    <p className="muted">Herramienta exclusiva del Master para volver a comenzar las pruebas con la base operativa en cero.</p>
    <ResetTucitaDataButton/>
  </section>
 </main></div>;
}
