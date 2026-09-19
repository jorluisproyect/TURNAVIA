'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { LogOut } from 'lucide-react';

export function LogoutButton(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  async function logout(){
    setBusy(true);
    try{await authClient.signOut();}finally{
      router.replace('/ingresar');
      router.refresh();
    }
  }
  return <button className="side-link" onClick={logout} disabled={busy} style={{width:'100%',border:0,background:'transparent',cursor:'pointer'}}><LogOut size={18}/>{busy?'Saliendo...':'Cerrar sesión'}</button>;
}
