import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

export function countryPhoneInfo(country:string){
  return COUNTRY_PHONE_CODES.find(x=>x.country===country)||COUNTRY_PHONE_CODES[0];
}

export function countryDialCode(country:string){
  return countryPhoneInfo(country).code;
}

export function phoneAllowedLengths(country:string){
  return [...countryPhoneInfo(country).nationalLengths];
}

export function phoneMinLength(country:string){
  return Math.min(...phoneAllowedLengths(country));
}

export function phoneMaxLength(country:string){
  return Math.max(...phoneAllowedLengths(country));
}

export function phoneLengthHelp(country:string){
  const lengths=phoneAllowedLengths(country);
  if(lengths.length===1)return `exactamente ${lengths[0]} dígitos`;
  if(lengths.length===2)return `${lengths[0]} o ${lengths[1]} dígitos`;
  const sorted=[...lengths].sort((a,b)=>a-b);
  const consecutive=sorted.every((n,i)=>i===0||n===sorted[i-1]+1);
  if(consecutive)return `entre ${sorted[0]} y ${sorted[sorted.length-1]} dígitos`;
  return sorted.slice(0,-1).join(', ')+' o '+sorted[sorted.length-1]+' dígitos';
}

export function digitsOnly(value:string,max=15){
  return String(value||'').replace(/\D/g,'').slice(0,max);
}

export function validatePhone(country:string,local:string){
  const selected=COUNTRY_PHONE_CODES.find(x=>x.country===country);
  if(!selected)return {error:'Selecciona un país válido para tu teléfono.',phone:''};

  let digits=String(local||'').trim().replace(/\D/g,'');

  // Si el usuario escribe un 0 inicial de marcación nacional, lo quitamos cuando
  // el código internacional ya está separado (+58, +44, etc.).
  if(digits.startsWith('0')&&!selected.nationalLengths.includes(digits.length as never)){
    const withoutZero=digits.slice(1);
    if(selected.nationalLengths.includes(withoutZero.length as never))digits=withoutZero;
  }

  if(!/^\d+$/.test(digits))return {error:'El teléfono solo debe contener números.',phone:''};

  const allowed=[...selected.nationalLengths] as number[];
  if(!allowed.includes(digits.length)){
    return {
      error:`Para ${selected.country} el número nacional debe tener ${phoneLengthHelp(selected.country)}. El ${selected.code} se agrega automáticamente.`,
      phone:''
    };
  }

  return {error:'',phone:selected.code+' '+digits};
}
