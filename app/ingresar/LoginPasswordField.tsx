'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPasswordField(){
  const [show,setShow]=useState(false);

  return <div className="field">
    <label>Contraseña</label>
    <div style={{position:'relative'}}>
      <input
        name="password"
        type={show?'text':'password'}
        required
        autoComplete="current-password"
        style={{paddingRight:46}}
      />
      <button
        type="button"
        aria-label={show?'Ocultar contraseña':'Mostrar contraseña'}
        onClick={()=>setShow(v=>!v)}
        style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',border:0,background:'transparent',padding:6,color:'var(--muted)',display:'grid',placeItems:'center',cursor:'pointer'}}
      >
        {show?<EyeOff size={18}/>:<Eye size={18}/>}
      </button>
    </div>
    <Link href="/olvidar-contrasena" tabIndex={-1} style={{fontSize:13,display:'inline-block',marginTop:7}}>¿Olvidaste tu contraseña?</Link>
  </div>;
}
