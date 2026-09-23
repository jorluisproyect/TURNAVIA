export const SUPPORTED_CURRENCIES=['USD','EUR','USDT','VES'] as const;
export type SupportedCurrency=typeof SUPPORTED_CURRENCIES[number];

export type FxSnapshot={
  base:'USD';
  rates:Record<SupportedCurrency,number>;
  updatedAt:string|null;
  source:string;
  available:boolean;
};

export async function getFxSnapshot():Promise<FxSnapshot>{
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/USD',{next:{revalidate:3600}});
    if(!r.ok)throw new Error('fx_http_'+r.status);
    const j:any=await r.json();
    const eur=Number(j?.rates?.EUR);
    const ves=Number(j?.rates?.VES);
    if(!(eur>0)||!(ves>0))throw new Error('fx_rates_missing');
    return {
      base:'USD',
      rates:{USD:1,EUR:eur,USDT:1,VES:ves},
      updatedAt:j?.time_last_update_utc||null,
      source:'ExchangeRate-API',
      available:true
    };
  }catch(error){
    console.error('TUCITA FX error',error);
    return {
      base:'USD',
      rates:{USD:1,EUR:0,USDT:1,VES:0},
      updatedAt:null,
      source:'ExchangeRate-API',
      available:false
    };
  }
}

export function convertMoney(amount:number,from:string,to:string,rates:Record<string,number>){
  const f=Number(rates[from]);
  const t=Number(rates[to]);
  if(!(f>0)||!(t>0))return null;
  const usd=Number(amount||0)/f;
  return usd*t;
}
