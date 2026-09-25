export type ServiceMediaMeta={
  details:string;
  image:string;
};

const PREFIX='TUCITA_SERVICE_V1:';
const DATA_IMAGE=/^data:image\/(jpeg|png|webp);base64,/i;

export function parseServiceMedia(value?:string|null):ServiceMediaMeta{
  const raw=String(value||'');
  if(!raw.startsWith(PREFIX))return {details:raw,image:''};
  try{
    const parsed=JSON.parse(raw.slice(PREFIX.length));
    return {
      details:typeof parsed?.details==='string'?parsed.details:'',
      image:typeof parsed?.image==='string'&&DATA_IMAGE.test(parsed.image)?parsed.image:''
    };
  }catch{
    return {details:raw,image:''};
  }
}

export function serializeServiceMedia(meta:Partial<ServiceMediaMeta>){
  return PREFIX+JSON.stringify({
    details:String(meta.details||'').trim().slice(0,1800),
    image:String(meta.image||'')
  });
}

export function validateServiceMedia(meta:Partial<ServiceMediaMeta>){
  const image=String(meta.image||'');
  if(image&&(!DATA_IMAGE.test(image)||image.length>420_000)){
    return 'La foto del servicio es demasiado grande o no es válida.';
  }
  return '';
}
