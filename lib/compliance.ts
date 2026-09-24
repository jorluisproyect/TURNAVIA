export const COMPLIANCE_VERSION='2026-09-24-v1';
export const ADULT_CATEGORY='Servicios para adultos (no sexuales)';

const ADULT_ALIASES=[ADULT_CATEGORY,'Servicios 18+'];

const PROHIBITED_PATTERNS=[
  /\bprostituci[oó]n\b/i,
  /\bescort(?:s)?\b/i,
  /\bservicio(?:s)?\s+sexual(?:es)?\b/i,
  /\bmasaje(?:s)?\s+sexual(?:es)?\b/i,
  /\bsexo\s+(oral|anal|pagado|por\s+dinero)\b/i,
  /\bacto(?:s)?\s+sexual(?:es)?\b/i,
  /\bsugar\s*(daddy|mommy|dating)\b/i,
  /\bcitas?\s+(remuneradas?|pagadas?|con\s+compensaci[oó]n)\b/i,
  /\bpornograf[ií]a\b/i,
  /\bcontenido\s+sexual\s+expl[ií]cito\b/i,
  /\btrata\s+de\s+personas\b/i,
  /\bexplotaci[oó]n\s+sexual\b/i,
  /\bmenor(?:es)?\s+de\s+edad\b.*\bsexual/i,
  /\bsexual\b.*\bmenor(?:es)?\s+de\s+edad\b/i
];

export function isAdultOnlyCategory(category?:string|null){
  const c=String(category||'').trim().toLowerCase();
  return ADULT_ALIASES.some(x=>x.toLowerCase()===c);
}

export function prohibitedMarketplaceReason(...values:(string|null|undefined)[]){
  const text=values.map(v=>String(v||'')).join(' ');
  for(const p of PROHIBITED_PATTERNS){
    if(p.test(text))return 'TUCITA no permite servicios sexuales pagados, prostitución, escorts con finalidad sexual, citas remuneradas, explotación, trata de personas, pornografía ni actividades sexuales que involucren menores.';
  }
  return '';
}

export function adultComplianceRequired(category?:string|null){
  return isAdultOnlyCategory(category);
}

export const PROVIDER_COMPLIANCE_TEXT='Declaro que los servicios publicados son legales donde los presto, que cuento con las licencias o permisos exigidos y que cumpliré las políticas de TUCITA.';
export const ADULT_COMPLIANCE_TEXT='Declaro ser mayor de edad y que esta cuenta +18 se usará únicamente para actividades legales y no sexuales. No publicaré prostitución, escorts sexuales, citas remuneradas, actos sexuales pagados, pornografía, explotación, trata ni servicios que involucren menores.';
