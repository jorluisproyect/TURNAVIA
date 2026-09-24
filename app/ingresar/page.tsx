import Link from 'next/link';
import { Brand } from '@/components/Brand';

export const dynamic='force-dynamic';

type Params=Promise<Record<string,string|string[]|undefined>>;

export default async function Ingresar({searchParams}:{searchParams?:Params}){
  const sp=(await searchParams)||{};
  const nextRaw=Array.isArray(sp.next)?sp.next[0]:sp.next||'';
  const errorRaw=Array.isArray(sp.error)?sp.error[0]:sp.error||'';
  const next=nextRaw.startsWith('/equipo/aceptar?invite=') && nextRaw.length<500 && !/[\r\n]/.test(nextRaw)
    ? nextRaw
    : '';

  const message=
    errorRaw==='credentials'?'Correo o contraseña incorrectos.':
    errorRaw==='server'?'No se pudo iniciar sesión. Intenta nuevamente.':
    '';

  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/><Link className="btn btn-secondary" href="/">Inicio</Link></div>
    <div className="demo-head">
      <span className="eyebrow">Acceso seguro</span>
      <h1>Ingresa a TUCITA</h1>
      <p className="muted">Profesionales, negocios y clientes usan el correo y la contraseña que ellos mismos crearon.</p>
    </div>
    <section className="profile-card">
      <form action="/api/login" method="post" className="form">
        <input type="hidden" name="next" value={next}/>
        <div className="field">
          <label>Correo / usuario</label>
          <input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="correo@ejemplo.com"/>
          <small className="muted">Tu correo es tu usuario de acceso a TUCITA.</small>
        </div>
        <div className="field">
          <div className="row space">
            <label>Contraseña</label>
            <Link href="/olvidar-contrasena" style={{fontSize:13}}>¿La olvidaste?</Link>
          </div>
          <input name="password" type="password" required autoComplete="current-password"/>
        </div>
        {message&&<div className="notice danger" role="alert">{message}</div>}
        <button className="btn btn-primary" type="submit">Ingresar</button>
        <div className="button-row"><Link href="/registro" className="btn btn-secondary">Crear cuenta TUCITA</Link></div>
      </form>
    </section>
  </div></main>;
}
