'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ImagePlus, Trash2, UserRound } from 'lucide-react';
import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

function splitPhone(value:string){
  const v=String(value||'').trim();
  const found=[...COUNTRY_PHONE_CODES].sort((a,b)=>b.code.length-a.code.length).find(x=>v.startsWith(x.code));
  return found?{code:found.code,local:v.slice(found.code.length).trim()}:{code:'+58',local:v};
}
function fullPhone(code:string,local:string){return (code+' '+String(local||'').replace(/^0+/,'').trim()).trim()}
async function resizeAvatar(file:File){
  if(file.size>5_000_000)throw new Error('La imagen supera 5 MB.');
  const src=URL.createObjectURL(file);
  try{
    const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=src});
    const size=256,ratio=Math.max(size/img.width,size/img.height),sw=size/ratio,sh=size/ratio,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    canvas.getContext('2d')?.drawImage(img,sx,sy,sw,sh,0,0,size,size);
    return canvas.toDataURL('image/webp',.75);
  }finally{URL.revokeObjectURL(src)}
}

export default function PerfilPaciente(){
  const [form,setForm]=useState({name:'',email:'',phoneCode:'+58',phoneLocal:'',nationalId:'',profileImage:''});
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{fetch('/api/me/patient').then(r=>r.json()).then(j=>{if(j.patient){const ph=splitPhone(j.patient.phone||'');setForm({name:j.patient.name||'',email:j.patient.email||'',phoneCode:ph.code,phoneLocal:ph.local,nationalId:j.patient.nationalId||'',profileImage:j.patient.profileImage||''})}setLoading(false)}).catch(()=>setLoading(false))},[]);

  async function photo(file?:File){
    if(!file)return;
    try{setForm(x=>({...x,profileImage:await resizeAvatar(file)}))}catch(e:any){setMsg(e?.message||'No se pudo procesar la foto.');setTimeout(()=>setMsg(''),1800)}
  }

  async function save(){
    const r=await fetch('/api/me/patient',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action:'profile',...form,phone:fullPhone(form.phoneCode,form.phoneLocal)})});
    const j=await r.json();setMsg(r.ok?'Perfil actualizado':j.error||'No se pudo guardar');setTimeout(()=>setMsg(''),1800);
  }

  return <div className="dashboard"><Sidebar role="paciente"/><main className="main">
    <div className="topbar"><div><div className="muted" style={{fontSize:13}}>Mi cuenta</div><h1>Perfil</h1></div></div>
    <section className="panel"><h2>Datos personales</h2>{loading?<div>Cargando…</div>:<div className="form">
      <div className="field"><label>Foto de perfil</label><div className="row" style={{gap:12,alignItems:'center',flexWrap:'wrap'}}>{form.profileImage?<img src={form.profileImage} alt="Foto de perfil" style={{width:82,height:82,borderRadius:22,objectFit:'cover'}}/>:<div className="profile-avatar" style={{width:82,height:82}}><UserRound size={30}/></div>}<label className="btn btn-secondary" style={{cursor:'pointer'}}><ImagePlus size={16}/> {form.profileImage?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={e=>photo(e.target.files?.[0])}/></label>{form.profileImage&&<button type="button" className="btn btn-secondary" onClick={()=>setForm({...form,profileImage:''})}><Trash2 size={15}/> Quitar</button>}</div><small className="muted">La imagen se ajusta automáticamente para no deformarse.</small></div>
      <div className="field"><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
      <div className="field"><label>Correo de acceso</label><input value={form.email} readOnly/></div>
      <div className="field"><label>Teléfono</label><div className="row" style={{gap:8,alignItems:'stretch',flexWrap:'wrap'}}><select value={form.phoneCode} onChange={e=>setForm({...form,phoneCode:e.target.value})} style={{maxWidth:210}}>{COUNTRY_PHONE_CODES.map(x=><option key={x.country+x.code} value={x.code}>{x.country} {x.code}</option>)}</select><input style={{flex:1,minWidth:180}} value={form.phoneLocal} onChange={e=>setForm({...form,phoneLocal:e.target.value})} placeholder="Número sin código de país"/></div></div>
      <div className="field"><label>Documento (opcional)</label><input value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></div>
      <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
    </div>}</section>
    {msg&&<div className="toast">{msg}</div>}
  </main></div>;
}
