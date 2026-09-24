import Link from 'next/link';
import { Brand } from '@/components/Brand';

export default function Page(){
 return <main className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:56}}>
  <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link className="btn btn-secondary" href="/">Volver</Link></div>
  <section className="panel" style={{marginTop:24}}>
   <span className="eyebrow">TUCITA · LEGAL Y SEGURIDAD</span>
   <h1>Términos de uso</h1>
   <div style={{display:'grid',gap:12,lineHeight:1.65}}>
<p><strong>Versión 2026-09-24-v1.</strong> TUCITA es una plataforma tecnológica para publicar, descubrir y reservar servicios. El proveedor es responsable de que sus servicios sean legales, cuenten con licencias y permisos aplicables y cumplan las normas profesionales y de consumo de su jurisdicción.</p>
<h2>Servicios prohibidos</h2><p>No se permite usar TUCITA para prostitución, escorts con finalidad sexual, actos sexuales pagados, citas remuneradas o sugar dating, masajes sexuales, pornografía, explotación sexual, trata de personas, contenido sexual no consentido ni ninguna actividad sexual que involucre menores.</p>
<h2>Servicios +18</h2><p>Una categoría +18 en TUCITA significa exclusivamente actividad legal destinada a adultos y <strong>no sexual</strong>. El proveedor declara ser mayor de edad y cumplir las reglas locales de edad, licencias y protección al consumidor.</p>
<h2>Moderación</h2><p>TUCITA puede pausar, ocultar o eliminar perfiles o servicios que incumplan estas reglas, y conservar registros necesarios para investigar reportes, prevenir fraude y atender obligaciones legales.</p>
<h2>Alcance internacional</h2><p>La disponibilidad de una categoría o método de pago puede variar por país. TUCITA puede restringir funciones por jurisdicción para cumplir leyes, reglas de tiendas de aplicaciones y requisitos de procesadores de pago.</p>
<p><Link href="/legal/servicios-prohibidos">Ver política detallada de servicios prohibidos</Link>.</p></div>
  </section>
 </main>;
}