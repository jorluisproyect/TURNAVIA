import { COUNTRY_PHONE_CODES } from '@/lib/provider-catalog';

export function countryFromPhone(value?:string|null){
  const phone=String(value||'').replace(/\s+/g,'').trim();
  if(!phone)return '';
  const candidates=[...COUNTRY_PHONE_CODES]
    .sort((a,b)=>b.code.length-a.code.length)
    .filter(x=>phone.startsWith(x.code));
  if(!candidates.length)return '';
  // Several countries share +1. In that case the phone alone cannot safely
  // distinguish the country, so do not guess.
  const exactCode=candidates[0].code;
  const sameCode=candidates.filter(x=>x.code===exactCode);
  return sameCode.length===1?sameCode[0].country:'';
}
