'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, CircleCheck, Info, WalletCards } from 'lucide-react';

type AppNotification={
  id:string;
  type:string;
  title:string;
  message:string;
  link?:string|null;
  read_at?:string|null;
  created_at:string;
};

export function NotificationBell({mobile=false}:{mobile?:boolean}={}){
  const [items,setItems]=useState<AppNotification[]>([]);
  const [unread,setUnread]=useState(0);
  const [open,setOpen]=useState(false);

  const load=useCallback(async()=>{
    try{
      const r=await fetch('/api/notifications',{cache:'no-store'});
      if(!r.ok)return;
      const j=await r.json();
      setItems(j.notifications||[]);
      setUnread(Number(j.unread||0));
    }catch{}
  },[]);

  useEffect(()=>{
    load();
    const timer=setInterval(load,30000);
    return ()=>clearInterval(timer);
  },[load]);

  async function mark(id:string){
    await fetch('/api/notifications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id})});
    setItems(v=>v.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n));
    setUnread(v=>Math.max(0,v-1));
  }

  async function markAll(){
    await fetch('/api/notifications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({all:true})});
    setItems(v=>v.map(n=>({...n,read_at:n.read_at||new Date().toISOString()})));
    setUnread(0);
  }

  function Icon({type}:{type:string}){
    const t=String(type||'').toUpperCase();
    if(t==='SUCCESS')return <CircleCheck size={17}/>;
    if(t==='PAYMENT')return <WalletCards size={17}/>;
    if(t==='WARNING')return <CircleAlert size={17}/>;
    return <Info size={17}/>;
  }

  return <div style={{position:'relative'}}>
    <button type="button" className="side-link" onClick={()=>setOpen(v=>!v)} style={{width:'100%',position:'relative'}}>
      <Bell size={18}/> Notificaciones
      {unread>0&&<span style={{marginLeft:'auto',minWidth:22,height:22,padding:'0 6px',borderRadius:999,display:'grid',placeItems:'center',fontSize:11,fontWeight:800,background:'var(--brand)',color:'white'}}>{unread>9?'9+':unread}</span>}
    </button>

    {open&&<div style={mobile?{position:'fixed',left:12,right:12,bottom:92,width:'auto',maxHeight:'60dvh',overflow:'auto',zIndex:1300,background:'white',border:'1px solid var(--line)',borderRadius:18,boxShadow:'0 18px 50px rgba(0,0,0,.18)',padding:12,color:'var(--text)'}:{position:'absolute',left:'calc(100% + 10px)',bottom:0,width:360,maxWidth:'80vw',maxHeight:480,overflow:'auto',zIndex:1000,background:'white',border:'1px solid var(--line)',borderRadius:16,boxShadow:'0 18px 50px rgba(0,0,0,.18)',padding:12}}>
      <div className="row space" style={{gap:10,padding:'4px 4px 10px'}}>
        <div><strong>Notificaciones</strong><div className="muted" style={{fontSize:12}}>{unread} sin leer</div></div>
        {unread>0&&<button type="button" className="btn btn-secondary" style={{padding:'7px 9px'}} onClick={markAll}><CheckCheck size={14}/> Leer todo</button>}
      </div>

      {items.length===0?<div className="notice">No tienes notificaciones todavía.</div>:<div style={{display:'grid',gap:8}}>
        {items.map(n=>{
          const body=<div onClick={()=>!n.read_at&&mark(n.id)} className="notice" style={{cursor:'pointer',background:n.read_at?'white':'#eefaf6',alignItems:'flex-start'}}>
            <Icon type={n.type}/>
            <div style={{flex:1}}>
              <strong>{n.title}</strong>
              <div style={{fontSize:12,marginTop:4,lineHeight:1.45}}>{n.message}</div>
              <div className="muted" style={{fontSize:11,marginTop:5}}>{new Date(n.created_at).toLocaleString('es-VE')}</div>
            </div>
          </div>;
          return n.link?<Link key={n.id} href={n.link} onClick={()=>{if(!n.read_at)mark(n.id);setOpen(false)}} style={{textDecoration:'none',color:'inherit'}}>{body}</Link>:<div key={n.id}>{body}</div>
        })}
      </div>}
    </div>}
  </div>;
}
