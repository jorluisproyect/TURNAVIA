import Link from 'next/link';
import { Brand } from '@/components/Brand';

export default function Page(){
 return <main className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:56}}>
  <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link className="btn btn-secondary" href="/">Volver</Link></div>
  <section className="panel" style={{marginTop:24}}>
   <span className="eyebrow">TUCITA · LEGAL Y SEGURIDAD</span>
   <h1>Política de privacidad</h1>
   <div style={{display:'grid',gap:12,lineHeight:1.65}}>
<p><strong>Versión 2026-09-24-v1.</strong> TUCITA utiliza datos de cuenta, contacto, reservas, pagos, seguridad y operación para prestar el servicio.</p>
<h2>Minimización</h2><p>Se solicita únicamente información razonablemente necesaria para operar la cuenta y las reservas. Datos como documento de identidad o fecha de nacimiento se mantienen privados y no se muestran en perfiles públicos.</p>
<h2>Finalidades</h2><p>Los datos se usan para autenticar cuentas, gestionar reservas, confirmar pagos, enviar comunicaciones transaccionales, prevenir abuso, atender reportes y cumplir obligaciones legales.</p>
<h2>Seguridad y conservación</h2><p>TUCITA aplica controles técnicos y de acceso. La conservación debe limitarse al tiempo necesario para operación, prevención de fraude, resolución de disputas y obligaciones legales. Cuando un usuario solicita eliminación, se eliminan o desidentifican los datos cuando sea legalmente posible.</p>
<h2>Transferencias internacionales</h2><p>Al operar globalmente, algunos proveedores de infraestructura pueden procesar datos fuera del país del usuario. Antes de habilitar nuevos mercados se deben revisar las reglas locales de privacidad, transferencias internacionales y derechos de los titulares.</p>
<h2>Menores</h2><p>TUCITA no permite servicios sexuales ni explotación de menores. Las categorías restringidas por edad deben aplicar controles adecuados a la legislación local.</p></div>
  </section>
 </main>;
}