import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

export function countryPhoneInfo(country:string){
  return COUNTRY_PHONE_CODES.find(x=>x.country===country)||COUNTRY_PHONE_CODES[0];
}

export function countryDialCode(country:string){
  return countryPhoneInfo(country).code;
}

export function phoneAllowedLengths(country:string){
  return [...countryPhoneInfo(country).nationalLengths] as number[];
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

export function digitsOnly(value:string,max=20){
  return String(value||'').replace(/\D/g,'').slice(0,max);
}

/**
 * Accepts the ways people commonly type/paste a phone on mobile:
 * - national number: 4121234567
 * - domestic trunk zero: 04121234567
 * - full international: +58 412 123 4567 / 584121234567
 * The stored value is always the selected country's international code + national number.
 */
export function normalizedNationalPhone(country:string,value:string){
  const selected=COUNTRY_PHONE_CODES.find(x=>x.country===country);
  if(!selected)return '';
  const allowed=[...selected.nationalLengths] as number[];
  const max=Math.max(...allowed);
  const codeDigits=selected.code.replace(/\D/g,'');
  let digits=digitsOnly(value,24);

  // Paste with 00 international prefix.
  if(digits.startsWith('00'+codeDigits)&&digits.length>max){
    digits=digits.slice(2+codeDigits.length);
  // Paste with the selected country's international prefix.
  }else if(digits.startsWith(codeDigits)&&digits.length>max){
    const withoutCode=digits.slice(codeDigits.length);
    if(withoutCode.length>=Math.min(...allowed))digits=withoutCode;
  }

  // Domestic trunk prefix, e.g. Venezuela 0412... or UK 07...
  // Italy is a known exception where the leading zero can be part of the
  // internationally dialled subscriber number, so we preserve it.
  if(digits.startsWith('0')&&selected.country!=='Italia'){
    const withoutZero=digits.slice(1);
    if(allowed.includes(withoutZero.length))digits=withoutZero;
  }

  return digits;
}

export function validatePhone(country:string,local:string){
  const selected=COUNTRY_PHONE_CODES.find(x=>x.country===country);
  if(!selected)return {error:'Selecciona un país válido para tu teléfono.',phone:'',national:''};

  const digits=normalizedNationalPhone(country,local);
  if(!digits)return {error:'Escribe tu número de teléfono.',phone:'',national:''};

  const allowed=[...selected.nationalLengths] as number[];
  const codeDigits=selected.code.replace(/\D/g,'');
  const e164MaxNational=Math.max(7,15-codeDigits.length);

  // Country lengths are useful guidance, but they must not block a real user:
  // numbering plans and mobile prefixes change, and some countries have valid
  // ranges beyond the common examples in our selector.
  if(!allowed.includes(digits.length)&&(digits.length<7||digits.length>e164MaxNational)){
    return {
      error:`Revisa el teléfono. Para ${selected.country} normalmente se usan ${phoneLengthHelp(selected.country)}. Puedes escribirlo con o sin ${selected.code}.`,
      phone:'',
      national:digits
    };
  }

  return {error:'',phone:selected.code+' '+digits,national:digits};
}
