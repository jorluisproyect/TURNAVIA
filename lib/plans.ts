export type PlanKey = 'PROFESSIONAL' | 'BUSINESS';
export type BillingMonths=1|3|12;
export const BILLING_MONTHS:BillingMonths[]=[1,3,12];
export function validBillingMonths(value:number):value is BillingMonths{return BILLING_MONTHS.includes(value as BillingMonths)}
export type BillingCycleMonths = 1 | 3 | 12;

export const PLANS = {
  PROFESSIONAL: {
    key: 'PROFESSIONAL' as const,
    label: 'Profesional independiente',
    activation: 25,
    monthly: 15,
    initial: 40,
    maxProfessionals: 1,
    trialDays: 15,
    renewal: {
      1: 15,
      3: 45,
      12: 125,
    } as Record<BillingCycleMonths, number>,
  },
  BUSINESS: {
    key: 'BUSINESS' as const,
    label: 'Negocio / local',
    activation: 100,
    monthly: 49,
    initial: 149,
    maxProfessionals: 5,
    trialDays: 15,
    renewal: {
      1: 49,
      3: 147,
      12: 588,
    } as Record<BillingCycleMonths, number>,
  },
};

export function planFromType(type: string) {
  const normalized=String(type||'').toLowerCase();
  return normalized.startsWith('negocio') || normalized.startsWith('clínica') || normalized.startsWith('clinica')
    ? PLANS.BUSINESS
    : PLANS.PROFESSIONAL;
}

export function billingAmount(type:string,months:BillingCycleMonths,isRenewal:boolean){
  const plan=planFromType(type);
  const renewal=plan.renewal[months];
  return isRenewal?renewal:plan.activation+renewal;
}

/** Public prices in USD. Professional annual promotion includes activation at no extra cost. */
export function billingQuote(type:string,months:BillingMonths,isRenewal:boolean){
  const plan=planFromType(type);
  const base=plan.monthly*months;
  const planAmount=months===12&&plan.key==='PROFESSIONAL'?125:base;
  const activation=isRenewal||months===12&&plan.key==='PROFESSIONAL'?0:plan.activation;
  return {months,planAmount,activation,total:planAmount+activation,savings:base-planAmount,plan};
}
