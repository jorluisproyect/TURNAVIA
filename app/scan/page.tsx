'use client';
import { useEffect,useRef,useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera,ScanLine } from 'lucide-react';

export default function ScanPage(){
 const videoRef=useRef<HTMLVideoElement|null>(null);const streamRef=useRef<MediaStream|null>(null);const [msg,setMsg]=useState('');const [manual,setManual]=useState('');const router=useRouter();
 function openValue(value:string){const v=value.trim();if(!v)return;try{const u=new URL(v);const m=u.pathname.match(/\/checkin\/([^/]+)/);if(m){router.push('/checkin/'+decodeURIComponent(m[1]));return}}catch{}router.push('/checkin/'+encodeURIComponent(v))}
 useEffect(()=>{return()=>streamRef.current?.getTracks().forEach(t=>t.stop())},[]);
 async function start(){
  setMsg('');
  try{
   const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});streamRef.current=stream;
   if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
   const Detector=(window as any).BarcodeDetector;
   if(!Detector){setMsg('Tu navegador no admite lectura automática. Puedes escanear con la cámara del teléfono y abrir el enlace, o pegar el código abajo.');return}
   const detector=new Detector({formats:['qr_code']});
   const loop=async()=>{if(!videoRef.current||!streamRef.current)return;try{const codes=await detector.detect(videoRef.current);if(codes?.[0]?.rawValue){stream.getTracks().forEach(t=>t.stop());openValue(codes[0].rawValue);return}}catch{}requestAnimationFrame(loop)};requestAnimationFrame(loop);
  }catch{setMsg('No pudimos abrir la cámara. Revisa el permiso del navegador o usa el código manual.')}
 }
 return <main className="demo-chooser"><div className="container booking-wrap"><div className="profile-card">
  <span className="eyebrow"><ScanLine size={15}/> TUCITA</span><h1>Leer QR de cita</h1><p className="muted">Disponible para profesionales, recepción y administradores autorizados.</p>
  <video ref={videoRef} playsInline muted style={{width:'100%',maxHeight:420,borderRadius:18,background:'#0f172a'}}/>
  <button className="btn btn-primary" onClick={start} style={{marginTop:14}}><Camera size={16}/> Abrir cámara</button>
  {msg&&<div className="notice" style={{marginTop:12}}>{msg}</div>}
  <div className="field" style={{marginTop:18}}><label>Código manual / enlace del QR</label><input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Pega el código o enlace"/><button className="btn btn-secondary" onClick={()=>openValue(manual)} style={{marginTop:8}}>Validar código</button></div>
 </div></div></main>;
}
