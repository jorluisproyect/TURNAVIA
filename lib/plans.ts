export type PlanKey = 'DOCTOR' | 'CLINIC';

export const PLANS = {
  DOCTOR: {
    key: 'DOCTOR' as const,
    label: 'Médico independiente',
    activation: 25,
    monthly: 15,
    initial: 40,
    maxDoctors: 1,
    trialDays: 5,
  },
  CLINIC: {
    key: 'CLINIC' as const,
    label: 'Clínica / consultorio',
    activation: 100,
    monthly: 49,
    initial: 149,
    maxDoctors: 5,
    trialDays: 5,
  },
};

export function planFromType(type: string) {
  return type.startsWith('Clínica') ? PLANS.CLINIC : PLANS.DOCTOR;
}
