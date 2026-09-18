import { Suspense } from 'react';
import RegistroClient from './RegistroClient';

export default function RegistroPage(){
  return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap"><div className="profile-card">Cargando TURNAVIA...</div></div></main>}><RegistroClient/></Suspense>;
}
