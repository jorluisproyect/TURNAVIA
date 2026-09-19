'use client';
import { useEffect } from 'react';
export default function MasterError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('TURNAVIA Master error',error)},[error]);
  return <main className="demo-chooser"><div className="container booking-wrap"><div className="profile-card" style={{marginTop:40}}><h1>No pudimos cargar el Panel Master</h1><p className="muted">Tu cuenta sigue segura. Intenta cargar el panel nuevamente.</p><button className="btn btn-primary" onClick={()=>reset()}>Reintentar</button></div></div></main>;
}
