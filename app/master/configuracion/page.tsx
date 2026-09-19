import { Sidebar } from '@/components/Sidebar';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
import { hasDatabase } from '@/lib/db';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const dynamic='force-dynamic';

function State({ok,label}:{ok:boolean;label:string}){
 return <div className="notice row" style={{gap:9}}>{ok?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>}<span><strong>{label}</strong><br/><small className="muted">{ok?'Configurado':'Requiere configuración'}</small></span></div>;
}

export default function ConfiguracionMaster(){
 const authReady=Boolean(process.env.NEON_AUTH_BASE_URL);
 const appUrlReady=Boolean(process.env.APP_URL);
 const emailReady=Boolean(process.env.RESEND_API_KEY);
 const cookieReady=Boolean(process.env.NEON_AUTH_COOKIE_SECRET);

 return <div className="dashboard"><Sidebar role="master"/><main className="main">
  <div className="topbar"><div><div className="muted" style={{fontSize:13}}>TURNAVIA · Producción</div><h1>Configuración</h1></div><span className="pill"><ShieldCheck size={14}/> Solo Master</span></div>

  <section className="panel">
    <h2>Estado del sistema</h2>
    <p className="muted">Esta sección no muestra claves; solo confirma si las conexiones necesarias existen en el servidor.</p>
    <div className="grid-3" style={{marginTop:14}}>
      <State ok={hasDatabase} label="Base de datos Neon"/>
      <State ok={authReady} label="Neon Auth"/>
      <State ok={cookieReady} label="Sesiones seguras"/>
      <State ok={appUrlReady} label="URL de producción"/>
      <State ok={emailReady} label="Correos transaccionales"/>
    </div>
    {!emailReady&&<div className="notice" style={{marginTop:14}}><strong>Correos de TURNAVIA pendientes.</strong><br/>El acceso y recuperación de contraseña usan Neon Auth, pero para enviar bienvenida y confirmaciones personalizadas debes configurar <code>RESEND_API_KEY</code> y <code>EMAIL_FROM</code> en Vercel.</div>}
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Métodos para cobrar TURNAVIA</h2>
    <p className="muted">Estos métodos se usan para activaciones y mensualidades de profesionales y negocios.</p>
    <PaymentMethodsManager scope="MASTER"/>
  </section>

  <section className="panel" style={{marginTop:18}}>
    <h2>Modelo comercial</h2>
    <p className="muted">Profesional independiente: USD 25 activación + USD 15 primer mes. Negocio hasta 5 profesionales: USD 100 activación + USD 49 primer mes. Prueba gratuita: 5 días. La renovación mensual se controla desde Suscripciones.</p>
  </section>
 </main></div>;
}
