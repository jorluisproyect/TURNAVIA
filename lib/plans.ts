export type PlanKey = 'PROFESSIONAL' | 'BUSINESS';

export const PLANS = {
  PROFESSIONAL: {
    key: 'PROFESSIONAL' as const,
    label: 'Profesional independiente',
    activation: 25,
    monthly: 15,
    initial: 40,
    maxProfessionals: 1,
    trialDays: 15,
  },
  BUSINESS: {
    key: 'BUSINESS' as const,
    label: 'Negocio / local',
    activation: 100,
    monthly: 49,
    initial: 149,
    maxProfessionals: 5,
    trialDays: 15,
  },
};

export function planFromType(type: string) {
  const normalized=String(type||'').toLowerCase();
  return normalized.startsWith('negocio') || normalized.startsWith('clínica') || normalized.startsWith('clinica')
    ? PLANS.BUSINESS
    : PLANS.PROFESSIONAL;
}
