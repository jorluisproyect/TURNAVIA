import Link from 'next/link';
import { Brand } from '@/components/Brand';

export default function Page(){
 return <main className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:56}}>
  <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link className="btn btn-secondary" href="/">Volver</Link></div>
  <section className="panel" style={{marginTop:24}}>
   <span className="eyebrow">TUCITA · LEGAL Y SEGURIDAD</span>
   <h1>Servicios y contenidos prohibidos</h1>
   <div style={{display:'grid',gap:12,lineHeight:1.65}}>
<p>TUCITA no debe utilizarse para actividades ilegales ni para contenidos o servicios que comprometan la seguridad de las personas.</p>
<h2>Prohibición absoluta</h2>
<ul><li>Prostitución o actos sexuales a cambio de dinero, regalos o compensación.</li><li>Escorts o acompañamiento cuya finalidad sea sexual.</li><li>Masajes sexuales o servicios destinados a gratificación sexual.</li><li>Citas remuneradas, sugar dating o acuerdos sexuales con compensación.</li><li>Pornografía o contenido sexual explícito destinado a gratificación sexual.</li><li>Explotación sexual, trata de personas, coerción o contenido sexual sin consentimiento.</li><li>Cualquier contenido, contacto o servicio sexual que involucre menores.</li><li>Servicios ilegales en el país o lugar donde se prestan.</li></ul>
<h2>Contenido generado por proveedores</h2><p>Los proveedores deben publicar fotografías, textos y servicios apropiados. TUCITA ofrece un mecanismo de reporte y puede retirar contenido mientras se investiga.</p>
<h2>Pagos</h2><p>Que un servicio sea legal en una jurisdicción no obliga a una tienda de aplicaciones o procesador de pagos a aceptarlo. TUCITA puede bloquear categorías o métodos de pago para cumplir sus reglas.</p></div>
  </section>
 </main>;
}