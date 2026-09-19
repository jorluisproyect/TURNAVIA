'use client';
import { Sidebar } from '@/components/Sidebar';
import { PaymentMethodsManager } from '@/components/PaymentMethodsManager';
export default function ConfiguracionMaster(){
 return <div className="dashboard"><Sidebar role="master"/><main className="main"><div className="topbar"><div><div className="muted" style={{fontSize:13}}>TURNAVIA</div><h1>Configuración</h1></div></div><section className="panel"><h2>Métodos para cobrar TURNAVIA</h2><p className="muted">Estos métodos se usan para activaciones y mensualidades de profesionales y negocios.</p><PaymentMethodsManager scope="MASTER"/></section><section className="panel" style={{marginTop:18}}><h2>Modelo comercial</h2><p className="muted">Profesional independiente: USD 25 activación + USD 15 primer mes. Negocio hasta 5 profesionales: USD 100 activación + USD 49 primer mes. Prueba gratuita: 5 días.</p></section></main></div>;
}