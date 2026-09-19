import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { Sidebar } from '@/components/Sidebar';

export const dynamic='force-dynamic';

export default async function PerfilPaciente(){
  const {data:session}=await auth.getSession();
  const user=session?.user as any;
  let fullName=String(user?.name||'Paciente');
  let phone='';
  if(sql&&user?.id){
    const rows=await sql`SELECT full_name,phone FROM app_user_profiles WHERE auth_user_id=${String(user.id)} LIMIT 1`;
    if(rows[0]){
      fullName=String((rows[0] as any).full_name||fullName);
      phone=String((rows[0] as any).phone||'');
    }
  }
  return <div className="dashboard"><Sidebar role="paciente"/><main className="main"><div className="topbar"><div><div className="muted" style={{fontSize:13}}>Mi cuenta</div><h1>Perfil</h1></div></div><section className="panel"><h2>Datos personales</h2><div className="form"><div className="field"><label>Nombre</label><input value={fullName} readOnly/></div><div className="field"><label>Correo</label><input value={String(user?.email||'')} readOnly/></div><div className="field"><label>Teléfono</label><input value={phone} readOnly placeholder="Sin registrar"/></div></div></section></main></div>;
}
