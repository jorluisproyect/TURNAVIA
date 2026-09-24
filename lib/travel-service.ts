export type TravelServiceMeta={
  summary:string;
  details:string;
  image:string;
  travelDate:string;
  departureTime:string;
  returnTime:string;
  locationId:string;
  capacity:number;
};

const PREFIX='TUCITA_TRAVEL_V1:';
const DATA_IMAGE=/^data:image\/(jpeg|png|webp);base64,/i;

export function isTravelProvider(category?:string,activity?:string){
  const text=(String(category||'')+' '+String(activity||'')).toLowerCase();
  return ['viaje','turismo','tour','excurs','full day','full-day'].some(x=>text.includes(x));
}

export function parseTravelServiceDescription(value?:string|null):TravelServiceMeta|null{
  const raw=String(value||'');
  if(!raw.startsWith(PREFIX))return null;
  try{
    const parsed=JSON.parse(raw.slice(PREFIX.length));
    if(!parsed||typeof parsed!=='object')return null;
    return {
      summary:typeof parsed.summary==='string'?parsed.summary:'',
      details:typeof parsed.details==='string'?parsed.details:'',
      image:typeof parsed.image==='string'&&DATA_IMAGE.test(parsed.image)?parsed.image:'',
      travelDate:typeof parsed.travelDate==='string'?parsed.travelDate:'',
      departureTime:typeof parsed.departureTime==='string'?parsed.departureTime:'',
      returnTime:typeof parsed.returnTime==='string'?parsed.returnTime:'',
      locationId:typeof parsed.locationId==='string'?parsed.locationId:'',
      capacity:Math.max(1,Math.min(500,Number(parsed.capacity||1)))
    };
  }catch{return null}
}

export function travelServiceFields(value?:string|null){
  const raw=String(value||'');
  const meta=parseTravelServiceDescription(raw);
  if(meta)return meta;
  return {
    summary:raw.slice(0,180),
    details:raw,
    image:'',
    travelDate:'',
    departureTime:'',
    returnTime:'',
    locationId:'',
    capacity:1
  };
}

export function serializeTravelServiceDescription(meta:Partial<TravelServiceMeta>){
  return PREFIX+JSON.stringify({
    summary:String(meta.summary||'').trim().slice(0,220),
    details:String(meta.details||'').trim().slice(0,1800),
    image:String(meta.image||''),
    travelDate:String(meta.travelDate||'').slice(0,10),
    departureTime:String(meta.departureTime||'').slice(0,5),
    returnTime:String(meta.returnTime||'').slice(0,5),
    locationId:String(meta.locationId||'').slice(0,80),
    capacity:Math.max(1,Math.min(500,Number(meta.capacity||1)))
  });
}

export function validateTravelServiceMeta(meta:Partial<TravelServiceMeta>){
  const image=String(meta.image||'');
  if(image&&(!DATA_IMAGE.test(image)||image.length>420_000))return 'La foto del viaje es demasiado grande o no es válida.';
  const date=String(meta.travelDate||'');
  if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))return 'La fecha del viaje no es válida.';
  const locationId=String(meta.locationId||'');
  if(locationId&&!/^[0-9a-f-]{36}$/i.test(locationId))return 'El punto de salida no es válido.';
  const capacity=Number(meta.capacity||1);
  if(!Number.isFinite(capacity)||capacity<1||capacity>500)return 'Los cupos deben estar entre 1 y 500.';
  for(const [label,value] of [['salida',meta.departureTime],['regreso',meta.returnTime]] as const){
    const v=String(value||'');
    if(v&&!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v))return 'La hora de '+label+' no es válida.';
  }
  return '';
}
