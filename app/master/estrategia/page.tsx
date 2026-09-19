'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { BarChart3, CheckCircle2, Clock3, Copy, ExternalLink, Flame, MessageCircle, PlayCircle, Send, Sparkles, Target, Users } from 'lucide-react';

const DEMO='https://turnavia.vercel.app/demo';
const WHATSAPP='https://wa.me/584129365637?text='+encodeURIComponent('Hola, vi TURNAVIA y quiero una demostración para mi negocio.');

const tasks=[
  {id:'t1',time:'4:00–4:20 PM',title:'Publica en WhatsApp Status',detail:'Sube 2 piezas: problema → solución y luego CTA al demo. No publiques 8 artes seguidas.'},
  {id:'t2',time:'4:20–5:10 PM',title:'Prospección directa',detail:'Escribe a 15 negocios: barberías, uñas, spa, odontología y profesionales con agenda.'},
  {id:'t3',time:'5:10–6:00 PM',title:'Demos rápidas',detail:'A quien responda, envíale el demo y ofrece mostrárselo en 5 minutos por llamada o WhatsApp.'},
  {id:'t4',time:'6:00–7:00 PM',title:'Instagram / Facebook',detail:'Publica un Reel o carrusel corto y responde de inmediato cada comentario o DM.'},
  {id:'t5',time:'7:00–8:00 PM',title:'Seguimiento',detail:'Vuelve a los interesados con una pregunta cerrada: “¿Quieres probarlo 5 días en tu negocio?”'},
  {id:'t6',time:'8:00–9:00 PM',title:'Cierre del día',detail:'Empuja pruebas gratuitas y concreta la configuración del primer cliente que diga sí.'},
];

const scripts=[
  {
    id:'status',
    title:'Estado de WhatsApp',
    text:'¿Todavía organizas las citas de tu negocio por mensajes?\n\nCon TURNAVIA tus clientes ven servicios, precios, horarios disponibles y reservan desde su teléfono. Tú controlas agenda, pagos y comprobantes en un solo lugar.\n\n✅ 5 días de prueba gratis\n👉 Mira el demo: https://turnavia.vercel.app/demo\n\nEscríbeme “DEMO” y te lo configuro para tu negocio.'
  },
  {
    id:'dm',
    title:'Mensaje directo a un negocio',
    text:'Hola 👋 Vi tu negocio y estoy presentando TURNAVIA, un sistema para organizar citas, servicios, precios y pagos desde una sola plataforma. Lo adapté para negocios como el tuyo y puedes verlo funcionando sin instalar nada.\n\nTe paso un demo de 2 minutos: https://turnavia.vercel.app/demo\n\nSi te gusta, te activo 5 días de prueba gratis y lo dejamos configurado con tus servicios y horarios.'
  },
  {
    id:'reply',
    title:'Cuando preguntan “¿cuánto cuesta?”',
    text:'Tenemos dos opciones simples:\n\nProfesional independiente: $40 inicial y luego $15/mes.\nNegocio/local hasta 5 profesionales: $149 inicial y luego $49/mes.\n\nAntes de pagar tienes 5 días de prueba gratis para verlo funcionando con tu negocio. Si quieres, hoy mismo te lo configuro.'
  },
  {
    id:'close',
    title:'Mensaje de cierre',
    text:'Perfecto. Lo más fácil es que te active la prueba y carguemos tus servicios, precios y horario. Así lo pruebas con tu negocio real antes de decidir. ¿Te la creo hoy?'
  },
];

const objections=[
  ['“Yo manejo todo por WhatsApp.”','Perfecto, TURNAVIA no reemplaza tu WhatsApp: evita que tengas que responder una y otra vez horarios, precios y disponibilidad. WhatsApp queda para conversar; TURNAVIA organiza la operación.'],
  ['“No sé usar sistemas.”','Está diseñado para usarse desde el teléfono. Yo te lo dejo configurado y solo tendrás que revisar reservas, pagos y tu agenda.'],
  ['“Ahora no puedo pagar.”','Por eso tienes 5 días de prueba gratis. Lo pruebas con tu negocio primero y decides después.'],
  ['“Tengo pocos clientes.”','Precisamente: una agenda clara y un enlace de reserva hacen que se vea más profesional y te permiten atender mejor a los clientes que ya tienes mientras creces.'],
];

export default function EstrategiaVentas(){
  const [done,setDone]=useState<string[]>([]);
  const [copied,setCopied]=useState('');
  const [leads,setLeads]=useState(0);
  const [replies,setReplies]=useState(0);
  const [demos,setDemos]=useState(0);
  const [trials,setTrials]=useState(0);
  const [sales,setSales]=useState(0);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('turnavia-sales-strategy');
      if(raw){
        const s=JSON.parse(raw);
        setDone(s.done||[]);setLeads(s.leads||0);setReplies(s.replies||0);setDemos(s.demos||0);setTrials(s.trials||0);setSales(s.sales||0);
      }
    }catch{}
  },[]);

  useEffect(()=>{
    try{localStorage.setItem('turnavia-sales-strategy',JSON.stringify({done,leads,replies,demos,trials,sales}))}catch{}
  },[done,leads,replies,demos,trials,sales]);

  const progress=Math.round(done.length/tasks.length*100);
  const responseRate=leads?Math.round(replies/leads*100):0;
  const demoRate=replies?Math.round(demos/replies*100):0;

  function toggle(id:string){
    setDone(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  }

  async function copy(id:string,text:string){
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(()=>setCopied(''),1400);
  }

  const score=useMemo(()=>Math.min(100,Math.round((leads/20)*30+(replies/8)*20+(demos/5)*20+(trials/2)*15+(sales/1)*15)),[leads,replies,demos,trials,sales]);

  return <div className="dashboard">
    <Sidebar role="master"/>
    <main className="main">
      <div className="topbar">
        <div>
          <div className="muted" style={{fontSize:13}}>TURNAVIA · Comercial</div>
          <h1>Estrategia para publicar y conseguir ventas</h1>
        </div>
        <div className="button-row">
          <a href={DEMO} target="_blank" rel="noreferrer" className="btn btn-secondary"><PlayCircle size={16}/> Abrir demo</a>
          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn btn-primary"><MessageCircle size={16}/> Abrir WhatsApp</a>
        </div>
      </div>

      <section className="panel" style={{background:'linear-gradient(135deg,#103e3b,#0b6f69)',color:'white',marginBottom:18}}>
        <div className="row space" style={{gap:18,flexWrap:'wrap'}}>
          <div style={{maxWidth:720}}>
            <span className="eyebrow" style={{background:'rgba(255,255,255,.12)',color:'white'}}><Flame size={15}/> MISIÓN DE HOY</span>
            <h2 style={{fontSize:30,margin:'14px 0 8px'}}>No busques “muchas vistas”. Busca conversaciones.</h2>
            <p style={{color:'#d6ebe7',lineHeight:1.7,margin:0}}>La meta de hoy es hablar directamente con negocios que ya viven de citas. El contenido atrae; el mensaje directo y la demo cierran.</p>
          </div>
          <div style={{minWidth:220}}>
            <div style={{fontSize:44,fontWeight:900}}>{score}%</div>
            <div style={{color:'#d6ebe7'}}>avance comercial de hoy</div>
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <Counter label="Contactos" value={leads} target={20} onMinus={()=>setLeads(Math.max(0,leads-1))} onPlus={()=>setLeads(leads+1)}/>
        <Counter label="Respuestas" value={replies} target={8} onMinus={()=>setReplies(Math.max(0,replies-1))} onPlus={()=>setReplies(replies+1)}/>
        <Counter label="Demos enviadas" value={demos} target={5} onMinus={()=>setDemos(Math.max(0,demos-1))} onPlus={()=>setDemos(demos+1)}/>
        <Counter label="Pruebas / ventas" value={trials+sales} target={3} onMinus={()=>trials?setTrials(trials-1):setSales(Math.max(0,sales-1))} onPlus={()=>setTrials(trials+1)}/>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="row space" style={{gap:12,flexWrap:'wrap'}}>
            <div><h2>Plan de ejecución de hoy</h2><p className="muted" style={{marginTop:-8}}>Hazlo en este orden. Marca cada bloque cuando lo termines.</p></div>
            <span className="pill">{progress}% completado</span>
          </div>
          <div style={{height:8,background:'var(--line)',borderRadius:999,overflow:'hidden',margin:'12px 0 16px'}}><div style={{height:'100%',width:progress+'%',background:'var(--brand)'}}/></div>
          <div style={{display:'grid',gap:10}}>{tasks.map(t=><button key={t.id} onClick={()=>toggle(t.id)} className="card" style={{textAlign:'left',cursor:'pointer',padding:16,borderColor:done.includes(t.id)?'#83d6bd':'var(--line)',background:done.includes(t.id)?'#eefaf6':'white'}}>
            <div className="row" style={{alignItems:'flex-start'}}>
              {done.includes(t.id)?<CheckCircle2 size={22} color="#198754"/>:<Clock3 size={22}/>}
              <div><div className="muted" style={{fontSize:12,fontWeight:800}}>{t.time}</div><strong>{t.title}</strong><p style={{margin:'5px 0 0'}}>{t.detail}</p></div>
            </div>
          </button>)}</div>
        </section>

        <aside style={{display:'grid',gap:18}}>
          <section className="panel">
            <h2>Objetivo mínimo</h2>
            <div className="notice"><strong>20 contactos → 8 respuestas → 5 demos → 2 pruebas → 1 venta.</strong></div>
            <p className="muted" style={{fontSize:13}}>No es una garantía; es el embudo operativo para obligarnos a generar suficiente actividad comercial hoy.</p>
          </section>
          <section className="panel">
            <h2>Qué rubros tocar primero</h2>
            <div style={{display:'grid',gap:8}}>
              {['Barberías','Uñas / salones','Spa / estética','Odontología / consultorios','Entrenadores / terapeutas'].map((x,i)=><div className="notice row" key={x}><Target size={16}/><span><strong>{i+1}. {x}</strong></span></div>)}
            </div>
          </section>
          <section className="panel">
            <h2>Embudo de hoy</h2>
            <div style={{display:'grid',gap:8}}>
              <Metric label="Respuesta" value={responseRate}/>
              <Metric label="Respuesta → demo" value={demoRate}/>
              <Metric label="Pruebas" value={trials}/>
              <Metric label="Ventas" value={sales}/>
            </div>
            <div className="button-row" style={{marginTop:12}}>
              <button className="btn btn-secondary" onClick={()=>setTrials(trials+1)}>+ prueba</button>
              <button className="btn btn-primary" onClick={()=>setSales(sales+1)}>+ venta</button>
            </div>
          </section>
        </aside>
      </div>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:12,flexWrap:'wrap'}}><div><h2>Mensajes listos para copiar</h2><p className="muted" style={{marginTop:-8}}>No mandes el mismo mensaje a 100 personas. Personaliza la primera línea con el nombre del negocio.</p></div><Send size={22}/></div>
        <div className="grid-3" style={{marginTop:14}}>{scripts.map(s=><div className="card" key={s.id}>
          <div className="row space"><strong>{s.title}</strong><button className="btn btn-secondary" style={{padding:'8px 10px'}} onClick={()=>copy(s.id,s.text)}><Copy size={14}/> {copied===s.id?'Copiado':'Copiar'}</button></div>
          <p style={{whiteSpace:'pre-wrap',fontSize:13,marginTop:12}}>{s.text}</p>
        </div>)}</div>
      </section>

      <section className="panel" style={{marginTop:18}}>
        <h2>Respuesta rápida a objeciones</h2>
        <div className="grid-3" style={{marginTop:12}}>{objections.map(([q,a])=><div className="card" key={q}><strong>{q}</strong><p style={{marginTop:10}}>{a}</p></div>)}</div>
      </section>

      <section className="panel" style={{marginTop:18}}>
        <div className="row space" style={{gap:14,flexWrap:'wrap'}}>
          <div>
            <span className="eyebrow"><Sparkles size={15}/> CIERRE</span>
            <h2 style={{fontSize:24,marginTop:12}}>Cuando alguien muestre interés, deja de vender por texto.</h2>
            <p className="muted">Pásalo al demo. Enséñale su rubro. Luego haz una sola pregunta: <strong>“¿Quieres que te active los 5 días gratis y te lo deje configurado hoy?”</strong></p>
          </div>
          <div className="button-row">
            <a href={DEMO} target="_blank" rel="noreferrer" className="btn btn-secondary"><ExternalLink size={16}/> Demo</a>
            <Link href="/activar" className="btn btn-primary"><Users size={16}/> Crear prueba</Link>
          </div>
        </div>
      </section>
    </main>
  </div>;
}

function Counter({label,value,target,onMinus,onPlus}:{label:string;value:number;target:number;onMinus:()=>void;onPlus:()=>void}){
  return <div className="stat"><small>{label}</small><div className="row space"><div className="n">{value}<span className="muted" style={{fontSize:13,fontWeight:500}}> / {target}</span></div><div className="row" style={{gap:5}}><button className="btn btn-secondary" style={{padding:'6px 9px'}} onClick={onMinus}>−</button><button className="btn btn-primary" style={{padding:'6px 9px'}} onClick={onPlus}>+</button></div></div></div>
}

function Metric({label,value}:{label:string;value:number}){
 return <div className="notice row space"><span>{label}</span><strong>{value}{typeof value==='number'&&label.includes('→')?'%':label==='Respuesta'?'%':''}</strong></div>
}
