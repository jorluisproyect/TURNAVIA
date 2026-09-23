import { Brand } from '@/components/Brand';
import { LogoutButton } from '@/components/LogoutButton';
import { Trash2 } from 'lucide-react';

export default function PerfilEliminado(){
  return <main className="demo-chooser"><div className="container booking-wrap">
    <div className="row space"><Brand/></div>
    <section className="profile-card" style={{marginTop:32,textAlign:'center'}}>
      <div className="iconbox" style={{margin:'0 auto 14px'}}><Trash2/></div>
      <h1>Tu perfil está eliminado</h1>
      <p className="muted">Este perfil ya no está activo ni visible en TUCITA. Solo el Master propietario puede restablecerlo.</p>
      <div style={{maxWidth:260,margin:'22px auto 0'}}><LogoutButton/></div>
    </section>
  </div></main>;
}
