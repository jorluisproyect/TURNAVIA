export type DepositMode='NONE'|'FIXED'|'PERCENT';

export type ServiceMediaMeta={
  details:string;
  image:string;
  depositMode:DepositMode;
  depositValue:number;
};

const PREFIX='TUCITA_SERVICE_V1:';
const DATA_IMAGE=/^data:image\/(jpeg|png|webp);base64,/i;

function depositMode(value:any):DepositMode{
  return value==='FIXED'||value==='PERCENT'?value:'NONE';
}

export function parseServiceMedia(value?:string|null):ServiceMediaMeta{
  const raw=String(value||'');
  if(!raw.startsWith(PREFIX))return {details:raw,image:'',depositMode:'NONE',depositValue:0};
  try{
    const parsed=JSON.parse(raw.slice(PREFIX.length));
    const mode=depositMode(parsed?.depositMode);
    const amount=Math.max(0,Number(parsed?.depositValue||0));
    return {
      details:typeof parsed?.details==='string'?parsed.details:'',
      image:typeof parsed?.image==='string'&&DATA_IMAGE.test(parsed.image)?parsed.image:'',
      depositMode:mode,
      depositValue:mode==='NONE'?0:amount
    };
  }catch{
    return {details:raw,image:'',depositMode:'NONE',depositValue:0};
  }
}

export function serializeServiceMedia(meta:Partial<ServiceMediaMeta>){
  const mode=depositMode(meta.depositMode);
  return PREFIX+JSON.stringify({
    details:String(meta.details||'').trim().slice(0,1800),
    image:String(meta.image||''),
    depositMode:mode,
    depositValue:mode==='NONE'?0:Math.max(0,Number(meta.depositValue||0))
  });
}

export function validateServiceMedia(meta:Partial<ServiceMediaMeta>){
  const image=String(meta.image||'');
  if(image&&(!DATA_IMAGE.test(image)||image.length>420_000)){
    return 'La foto del servicio es demasiado grande o no es válida.';
  }
  const mode=depositMode(meta.depositMode);
  const value=Number(meta.depositValue||0);
  if(mode==='PERCENT'&&(!Number.isFinite(value)||value<1||value>100))return 'El apartado porcentual debe estar entre 1% y 100%.';
  if(mode==='FIXED'&&(!Number.isFinite(value)||value<=0||value>1000000))return 'El monto fijo de apartado no es válido.';
  return '';
}
