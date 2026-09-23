import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

export function countryDialCode(country:string){
  return COUNTRY_PHONE_CODES.find(x=>x.country===country)?.code||'+58';
}
export function phoneMaxLength(code:string){
  return code==='+58'?11:Math.min(12,15-code.replace(/\D/g,'').length);
}
export function digitsOnly(value:string,max=11){
  return String(value||'').replace(/\D/g,'').slice(0,max);
}

export function validatePhone(country:string,local:string){
  const selected=COUNTRY_PHONE_CODES.find(x=>x.country===country);
  if(!selected)return {error:'Selecciona un país válido para tu teléfono.',phone:''};
  const digits=String(local||'').trim();
  if(!/^\d+$/.test(digits))return {error:'El teléfono solo debe contener números.',phone:''};
  if(selected.code==='+58'){
    // Venezuela: 0412... (11 dígitos) o 412... (10); +58 reemplaza el cero inicial.
    if(!/^(?:0\d{10}|\d{10})$/.test(digits)){
      return {error:'Para Venezuela escribe 10 dígitos o 11 si empieza por 0. El +58 se agrega automáticamente.',phone:''};
    }
    return {error:'',phone:'+58 '+digits.replace(/^0/,'')};
  }
  const max=phoneMaxLength(selected.code);
  if(digits.length<6||digits.length>max){
    return {error:'Escribe un número nacional de entre 6 y '+max+' dígitos.',phone:''};
  }
  return {error:'',phone:selected.code+' '+digits};
}
