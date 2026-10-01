'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function detectAppShell(){
  if(typeof window==='undefined') return false;
  const standalone=window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone=Boolean((window.navigator as Navigator & {standalone?:boolean}).standalone);
  const twa=document.referrer.startsWith('android-app://');
  const remembered=sessionStorage.getItem('tucita_app_shell')==='1';
  return Boolean(standalone||iosStandalone||twa||remembered);
}

export function AppEnvironment(){
  const pathname=usePathname();
  const router=useRouter();

  useEffect(()=>{
    const sync=()=>{
      const app=detectAppShell();
      document.documentElement.classList.toggle('app-shell-mode',app);
      if(app) sessionStorage.setItem('tucita_app_shell','1');
      if(app && pathname==='/') router.replace('/panel');
    };

    sync();
    const mq=window.matchMedia?.('(display-mode: standalone)');
    mq?.addEventListener?.('change',sync);
    return ()=>mq?.removeEventListener?.('change',sync);
  },[pathname,router]);

  return null;
}
