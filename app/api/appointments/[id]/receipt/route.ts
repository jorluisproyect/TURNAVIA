import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { MASTER_EMAIL } from '@/lib/access';
import { buildAppointmentReceiptPdf } from '@/lib/appointment-receipt';

export const runtime='nodejs';
export const dynamic='force-dynamic';

async function canAccess(id:string){
  if(!sql)return false;
  const {data:session}=await auth.getSession();
  if(!session?.user)return false;
  const email=String((session.user as any).email||'').toLowerCase();
  if(email===MASTER_EMAIL)return true;
  const rows=await sql`SELECT a.id,
      lower(p.email)=lower(${email}) AS patient_owner,
      lower(du.email)=lower(${email}) AS provider_owner,
      su.organization_id AS session_org,
      du.organization_id AS provider_org,
      ap.role AS app_role
    FROM appointments a
    JOIN patients p ON p.id=a.patient_id
    JOIN doctors d ON d.id=a.doctor_id
    JOIN users du ON du.id=d.user_id
    LEFT JOIN users su ON lower(su.email)=lower(${email})
    LEFT JOIN app_user_profiles ap ON ap.auth_user_id=${String(session.user.id)}
    WHERE a.id=${id}::uuid LIMIT 1`;
  const r=rows[0] as any;
  if(!r)return false;
  if(r.patient_owner||r.provider_owner)return true;
  if(String(r.app_role)==='MASTER')return true;
  if(['RECEPTION','CLINIC_ADMIN'].includes(String(r.app_role)) && r.session_org && String(r.session_org)===String(r.provider_org))return true;
  return false;
}

export async function GET(_req:Request,ctx:{params:Promise<{id:string}>}){
  const {id}=await ctx.params;
  if(!(await canAccess(id)))return NextResponse.json({error:'No autorizado'},{status:403});
  try{
    const {buffer,data}=await buildAppointmentReceiptPdf(id);
    return new NextResponse(buffer,{headers:{
      'Content-Type':'application/pdf',
      'Content-Disposition':`inline; filename="${String(data.receipt_number||'recibo-tucita')}.pdf"`,
      'Cache-Control':'private, no-store'
    }});
  }catch(e:any){
    return NextResponse.json({error:e?.message||'No se pudo generar el recibo'},{status:500});
  }
}
