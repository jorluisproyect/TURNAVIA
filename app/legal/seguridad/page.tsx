import Link from 'next/link';
import { Brand } from '@/components/Brand';

export default function Page(){
 return <main className="container" style={{maxWidth:900,paddingTop:32,paddingBottom:56}}>
  <div className="row space" style={{gap:12,flexWrap:'wrap'}}><Brand/><Link className="btn btn-secondary" href="/">Volver</Link></div>
  <section className="panel" style={{marginTop:24}}>
   <span className="eyebrow">TUCITA · LEGAL Y SEGURIDAD</span>
   <h1>Seguridad, reportes y servicios +18</h1>
   <div style={{display:'grid',gap:12,lineHeight:1.65}}>
<p>Los servicios marcados para mayores de edad son únicamente actividades legales y no sexuales. El acceso y la verificación de edad pueden variar según el país y el riesgo del servicio.</p>
<h2>Reportar</h2><p>En cada perfil público existe una opción para reportar contenido o servicios. Los reportes quedan registrados para revisión administrativa.</p>
<h2>Respuesta</h2><p>TUCITA puede pausar preventivamente un perfil, solicitar documentación, exigir cambios, bloquear una categoría o cerrar una cuenta cuando exista riesgo de incumplimiento, explotación o actividad ilegal.</p>
<h2>Verificación</h2><p>Cuando la legislación local lo exija, TUCITA deberá utilizar mecanismos de verificación de edad o identidad adecuados antes de habilitar determinadas actividades. La solución concreta debe evaluarse país por país.</p></div>
  </section>
 </main>;
}