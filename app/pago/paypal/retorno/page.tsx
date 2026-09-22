'use client';
import { Suspense,useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Brand } from '@/components/Brand';
import { CheckCircle2 } from 'lucide-react';
function ReturnContent(){
 const sp=useSearchParams(); const client=sp.get('client')||''; const order=sp.get('token')||''; const [state,setState]=useState('Confirmando el pago con PayPal...'); const [ok,setOk]=useState(false);
 useEffect(()=>{if(!client||!order){setState('Faltan datos del pago.');return}fetch('/api/payments/paypal/capture',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clientId:client,orderId:order})}).then(r=>r.json()).then(j=>{setOk(!!j.ok);setState(j.ok?'Pago confirmado. Tu cuenta TUCITA está activa.':j.error||`Estado PayPal: ${j.status}`)}).catch(()=>setState('No se pudo confirmar el pago.'))},[client,order]);
 return <main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card" style={{marginTop:40,textAlign:'center',padding:42}}>{ok&&<div className="iconbox" style={{margin:'0 auto'}}><CheckCircle2/></div>}<h1>{ok?'¡Bienvenido a TUCITA!':'Procesando pago'}</h1><p className="muted">{state}</p>{ok&&<div className="button-row" style={{justifyContent:'center'}}><Link href="/ingresar" className="btn btn-primary">Crear / usar acceso</Link><Link href="/operacion" className="btn btn-secondary">Ver primeros pasos</Link></div>}</div></div></main>
}
export default function Retorno(){return <Suspense fallback={<main className="demo-chooser"><div className="container booking-wrap"><Brand/><div className="profile-card">Confirmando...</div></div></main>}><ReturnContent/></Suspense>}
