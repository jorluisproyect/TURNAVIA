export function providerAudienceLabel(category?:string,activity?:string){
  const value=(String(category||'')+' '+String(activity||'')).toLowerCase();
  const patientWords=['salud','médic','medic','odont','psic','fisi','terap','clínic','clinic','pediatr','ginec','cardio','derma','nutri','veterin','enferm','oftal','trauma','rehabil'];
  return patientWords.some(w=>value.includes(w))?'Pacientes':'Clientes';
}
