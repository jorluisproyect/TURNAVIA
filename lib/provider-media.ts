export type ProviderMedia={
  about?:string;
  profileImage?:string;
  workImages?:string[];
};

const DATA_IMAGE=/^data:image\/(jpeg|png|webp);base64,/i;

export function parseProviderMedia(value?:string|null):ProviderMedia{
  const raw=String(value||'').trim();
  if(!raw)return {about:'',profileImage:'',workImages:[]};
  try{
    const parsed=JSON.parse(raw);
    if(parsed&&typeof parsed==='object'){
      return {
        about:typeof parsed.about==='string'?parsed.about:'',
        profileImage:typeof parsed.profileImage==='string'&&DATA_IMAGE.test(parsed.profileImage)?parsed.profileImage:'',
        workImages:Array.isArray(parsed.workImages)?parsed.workImages.filter((x:any)=>typeof x==='string'&&DATA_IMAGE.test(x)).slice(0,4):[]
      };
    }
  }catch{}
  return {about:raw,profileImage:'',workImages:[]};
}

export function serializeProviderMedia(current:string|undefined|null,next:{profileImage?:string;workImages?:string[]}){
  const previous=parseProviderMedia(current);
  const profileImage=typeof next.profileImage==='string'?next.profileImage:previous.profileImage||'';
  const workImages=Array.isArray(next.workImages)?next.workImages:previous.workImages||[];
  return JSON.stringify({
    about:previous.about||'',
    profileImage,
    workImages:workImages.slice(0,4)
  });
}

export function validateProviderMedia(profileImage?:string,workImages?:string[]){
  if(profileImage&&(!DATA_IMAGE.test(profileImage)||profileImage.length>450_000))return 'La foto de perfil es demasiado grande o no es válida.';
  if((workImages||[]).length>4)return 'Puedes cargar hasta 4 fotos de referencia.';
  for(const img of workImages||[]){
    if(!DATA_IMAGE.test(img)||img.length>500_000)return 'Una foto de referencia es demasiado grande o no es válida.';
  }
  return '';
}

export function categoryUsesWorkReferences(category?:string,activity?:string){
  const text=(String(category||'')+' '+String(activity||'')).toLowerCase();
  return [
    'belleza','barber','peluquer','manicur','uña','maquill','estética',
    'automotriz','detailing','autolavado',
    'hogar','electric','plomer','aire acondicionado','limpieza',
    'evento','fotograf','catering','vestido',
    'arquitect','diseñ','espacios','estudio de grabación',
    'grooming','mascota'
  ].some(x=>text.includes(x));
}
