export function passwordIssues(value:string){
  const issues:string[]=[];
  if(value.length<6) issues.push('mínimo 6 caracteres');
  if(value.length>8) issues.push('máximo 8 caracteres');
  if(!/[A-ZÁÉÍÓÚÑ]/.test(value)) issues.push('una mayúscula');
  if(!/[a-záéíóúñ]/.test(value)) issues.push('una minúscula');
  if(!/[0-9]/.test(value)) issues.push('un número');
  if(!/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/.test(value)) issues.push('un símbolo');
  return issues;
}

export function isStrongPassword(value:string){
  return passwordIssues(value).length===0;
}

export const PASSWORD_HELP='6 a 8 caracteres: una mayúscula, una minúscula, un número y un símbolo.';
