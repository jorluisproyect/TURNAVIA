export function normalizedDocument(value:unknown){
  const id=String(value||'').trim().toUpperCase();
  if(id.length>32||!/^[A-Z0-9 .-]*$/.test(id))return {error:'La cédula o documento debe tener máximo 32 caracteres válidos.',value:''};
  return {error:'',value:id};
}
export function normalizedBirthDate(value:unknown){
  const date=String(value||'').trim();
  if(!date)return {error:'',value:null as string|null};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return {error:'Indica una fecha de nacimiento válida.',value:null as string|null};
  const parsed=new Date(date+'T00:00:00Z');
  if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<'1900-01-01'||date>new Date().toISOString().slice(0,10)){
    return {error:'La fecha de nacimiento no puede ser futura ni anterior a 1900.',value:null as string|null};
  }
  return {error:'',value:date};
}
export function dateForInput(value:unknown){
  if(!value)return '';
  if(value instanceof Date)return Number.isNaN(value.getTime())?'':value.toISOString().slice(0,10);
  const raw=String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(raw)?raw.slice(0,10):'';
}
