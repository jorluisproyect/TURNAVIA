'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { LogOut } from 'lucide-react';

export function LogoutButton({variant='sidebar'}:{variant?:'sidebar'|'panel'}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  async function logout(){
    if(busy)return;
    setBusy(true);
    try{
      await fetch('/api/account/mode',{method:'DELETE'}).catch(()=>{});
      await authClient.signOut();
    }finally{
      router.replace('/ingresar');
      router.refresh();
    }
  }
  if(variant==='panel'){
    return <button className="btn btn-secondary" onClick={logout} disabled={busy} aria-busy={busy} style={{width:'100%'}}>
      <LogOut size={18}/>{busy?'Cerrando sesión…':'Cerrar sesión'}
    </button>;
  }
  return <button className="side-link" onClick={logout} disabled={busy} style={{width:'100%',border:0,background:'transparent',cursor:'pointer'}}>
    <LogOut size={18}/>{busy?'Saliendo...':'Cerrar sesión'}
  </button>;
}
