'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

type CountryOption={country:string;flag:string};
type LocationOption={value:string;label:string};

export function ExploreFilters({
  q,
  selectedCountry,
  selectedCity,
  selectedCategory,
  countries,
  locationsByCountry,
  categories
}:{
  q:string;
  selectedCountry:string;
  selectedCity:string;
  selectedCategory:string;
  countries:CountryOption[];
  locationsByCountry:Record<string,LocationOption[]>;
  categories:string[];
}){
  const [country,setCountry]=useState(selectedCountry||'ALL');
  const [city,setCity]=useState(selectedCity||'');

  const locations=useMemo(()=>{
    if(country==='ALL'){
      const seen=new Map<string,LocationOption>();
      for(const list of Object.values(locationsByCountry)){
        for(const item of list)if(!seen.has(item.label))seen.set(item.label,item);
      }
      return [...seen.values()].sort((a,b)=>a.label.localeCompare(b.label,'es'));
    }
    return locationsByCountry[country]||[];
  },[country,locationsByCountry]);

  return <form method="get" action="/explorar" className="form">
    <div className="row" style={{gap:10,alignItems:'end',flexWrap:'wrap'}}>
      <div className="field" style={{flex:2,minWidth:230}}>
        <label>Buscar profesional o servicio</label>
        <div style={{position:'relative'}}>
          <Search size={18} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)'}}/>
          <input name="q" defaultValue={q} placeholder="Ej. uñas francesas, pediatra, barbería…" style={{paddingLeft:40}}/>
        </div>
      </div>

      <div className="field" style={{flex:1,minWidth:205}}>
        <label>País</label>
        <select name="country" value={country} onChange={e=>{setCountry(e.target.value);setCity('')}}>
          <option value="ALL">🌎 Todos los países</option>
          {countries.map(x=><option key={x.country} value={x.country}>{x.flag} {x.country}</option>)}
        </select>
      </div>

      <div className="field" style={{flex:1,minWidth:200}}>
        <label>Ciudad / zona</label>
        <select name="city" value={city} onChange={e=>setCity(e.target.value)}>
          <option value="">{country==='ALL'?'Todas las ciudades / zonas':'Todas las ciudades / zonas del país'}</option>
          {locations.map(x=><option key={x.label} value={x.value}>{x.label}</option>)}
        </select>
      </div>

      <button className="btn btn-primary" type="submit" aria-label="Buscar"><Search size={18}/> Buscar</button>
    </div>

    <div className="row" style={{gap:10,alignItems:'end',flexWrap:'wrap'}}>
      <div className="field" style={{flex:1,minWidth:210}}>
        <label>Rubro</label>
        <select name="category" defaultValue={selectedCategory}>
          <option value="">Todos los rubros</option>
          {categories.map(category=><option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <Link className="btn btn-secondary" href="/explorar?country=ALL">Ver todo TUCITA</Link>
    </div>
  </form>;
}
