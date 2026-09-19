export function passwordIssues(value:string){
  const issues:string[]=[];
  if(value.length<8) issues.push('mínimo 8 caracteres');
  if(!/[A-ZÁÉÍÓÚÑ]/.test(value)) issues.push('una mayúscula');
  if(!/[0-9]/.test(value)) issues.push('un número');
  if(!/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(value)) issues.push('un símbolo');
  return issues;
}

export function isStrongPassword(value:string){
  return passwordIssues(value).length===0;
}

export const PASSWORD_HELP='Mínimo 8 caracteres, una mayúscula, un número y un símbolo.';
