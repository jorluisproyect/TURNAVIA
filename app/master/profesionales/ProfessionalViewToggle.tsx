'use client';

import { useEffect } from 'react';
import { usePathname,useRouter,useSearchParams } from 'next/navigation';
import { LayoutGrid, List } from 'lucide-react';

export default function ProfessionalViewToggle({currentView}:{currentView:'list'|'cards'}){
  const router=useRouter();
  const pathname=usePathname();
  const search=useSearchParams();

  useEffect(()=>{
    if(search.has('view'))return;
    const saved=window.localStorage.getItem('tucita-master-professionals-view');
    if(saved!=='cards'&&saved!=='list')return;
    if(saved===currentView)return;
    const params=new URLSearchParams(search.toString());
    params.set('view',saved);
    router.replace(pathname+'?'+params.toString(),{scroll:false});
  },[currentView,pathname,router,search]);

  function choose(view:'list'|'cards'){
    window.localStorage.setItem('tucita-master-professionals-view',view);
    const params=new URLSearchParams(search.toString());
    params.set('view',view);
    router.replace(pathname+'?'+params.toString(),{scroll:false});
  }

  return <div className="master-view-toggle" aria-label="Vista de profesionales">
    <button type="button" className={currentView==='list'?'active':''} onClick={()=>choose('list')} aria-pressed={currentView==='list'}>
      <List size={16}/> Lista
    </button>
    <button type="button" className={currentView==='cards'?'active':''} onClick={()=>choose('cards')} aria-pressed={currentView==='cards'}>
      <LayoutGrid size={16}/> Tarjetas
    </button>
  </div>;
}
