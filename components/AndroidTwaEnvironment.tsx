'use client';

import { useEffect } from 'react';

export function AndroidTwaEnvironment(){
  useEffect(()=>{
    const qs=new URLSearchParams(window.location.search);
    const explicit=qs.get('android')==='1';
    const twa=document.referrer.startsWith('android-app://ve.com.tucita.app');
    const active=explicit||twa||sessionStorage.getItem('tucita_android_twa')==='1';

    if(active){
      sessionStorage.setItem('tucita_android_twa','1');
      document.documentElement.classList.add('android-twa-mode');
      if(window.location.pathname==='/' && (explicit||twa)){
        window.location.replace('/app?android=1');
        return;
      }
    }

    return ()=>{};
  },[]);

  return null;
}
