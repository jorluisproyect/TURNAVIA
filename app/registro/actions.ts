'use server';
import { auth } from '@/lib/auth/server';
import { sql } from '@/lib/db';
import { sendTransactionalEmail, turnaviaEmail } from '@/lib/email';
import { redirect } from 'next/navigation';
import { passwordIssues } from '@/lib/password-policy';

function slugify(input:string){
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,42)||'profesional';
}

export async function registerUser(_prev:{error?:string}|null, formData:FormData){
  const name=String(formData.get('name')||'').trim();
  const email=String(formData.get('email')||'').trim().toLowerCase();
  const password=String(formData.get('password')||'');
  const phone=String(formData.get('phone')||'').trim();
  const rawRole=String(formData.get('role')||'PATIENT');
  const accountType=String(formData.get('accountType')||'PATIENT');
  const category=String(formData.get('category')||'Salud').trim();
  const activity=String(formData.get('activity')||'Médico').trim();
  const country=String(formData.get('country')||'Venezuela').trim()||'Venezuela';
  const requestedRole=rawRole==='DOCTOR'?'DOCTOR':'PATIENT';
  const role=requestedRole;
  const providerType=accountType==='BUSINESS'?'Negocio / local':'Profesional independiente';
  const buyIntent=String(formData.get('buyIntent')||'0')==='1';
  let commercialClientId='';
  let providerPublicPath='';
  let businessPublicPath='';

  if(!name||!email||!phone) return {error:'Completa nombre, correo y teléfono.'};
  const passwordProblems=passwordIssues(password);
  if(passwordProblems.length) return {error:'La contraseña necesita '+passwordProblems.join(', ')+'.'};

  const {data,error}=await auth.signUp.email({name,email,password});
  if(error) return {error:error.message||'No se pudo crear la cuenta.'};

  let authUserId=(data as any)?.user?.id || (data as any)?.id;
  if(!authUserId && sql){
    const found=await sql`SELECT id FROM neon_auth.user WHERE lower(email)=lower(${email}) LIMIT 1`;
    authUserId=(found[0] as any)?.id;
  }

  if(authUserId && sql){
    await sql`INSERT INTO app_user_profiles(auth_user_id,role,full_name,email,phone)
      VALUES(${String(authUserId)},${role}::user_role,${name},${email},${phone})
      ON CONFLICT(auth_user_id) DO UPDATE SET role=EXCLUDED.role,full_name=EXCLUDED.full_name,email=EXCLUDED.email,phone=EXCLUDED.phone,updated_at=now()`;

    if(role==='DOCTOR'){
      const existingUser=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
      let internalUserId=(existingUser[0] as any)?.id;
      let organizationId:any=null;

      if(accountType==='BUSINESS'){
        const orgSlug=slugify(name)+'-'+String(authUserId).slice(0,6);
        businessPublicPath='/negocio/'+orgSlug;
        const org=await sql`INSERT INTO organizations(name,slug,type,phone,email,subscription_status,monthly_price,activation_price,trial_ends_at)
          VALUES(${name},${orgSlug},'BUSINESS',${phone},${email},'TRIAL',49,100,now()+interval '5 days')
          ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,email=EXCLUDED.email
          RETURNING id`;
        organizationId=(org[0] as any)?.id;
      }

      if(!internalUserId){
        const u=await sql`INSERT INTO users(organization_id,role,full_name,email,phone,active)
          VALUES(${organizationId},'DOCTOR',${name},${email},${phone},true)
          RETURNING id`;
        internalUserId=(u[0] as any)?.id;
      }else{
        await sql`UPDATE users SET full_name=${name},phone=${phone},organization_id=COALESCE(${organizationId},organization_id),active=true WHERE id=${internalUserId}`;
      }

      const slug=slugify(name)+'-'+String(authUserId).slice(0,6);
      providerPublicPath='/reservar/'+slug;
      const doctorRows=await sql`INSERT INTO doctors(user_id,public_slug,specialty,provider_category,provider_activity,provider_type,consultation_price,consultation_currency)
        VALUES(${internalUserId},${slug},${activity||category},${category},${activity},${providerType},0,'USD')
        ON CONFLICT(user_id) DO UPDATE SET specialty=EXCLUDED.specialty,provider_category=EXCLUDED.provider_category,provider_activity=EXCLUDED.provider_activity,provider_type=EXCLUDED.provider_type
        RETURNING id`;
      const doctorId=(doctorRows[0] as any)?.id;

      let loc=await sql`SELECT l.id FROM doctor_locations dl JOIN locations l ON l.id=dl.location_id WHERE dl.doctor_id=${doctorId} LIMIT 1`;
      let locationId=(loc[0] as any)?.id;
      if(!locationId){
        const l=await sql`INSERT INTO locations(organization_id,name,address,city,state,country,active)
          VALUES(${organizationId},${name+' · ubicación principal'},'',NULL,NULL,${country},true) RETURNING id`;
        locationId=(l[0] as any)?.id;
        await sql`INSERT INTO doctor_locations(doctor_id,location_id,room) VALUES(${doctorId},${locationId},NULL) ON CONFLICT DO NOTHING`;
      }

      const services=await sql`SELECT id FROM provider_services WHERE doctor_id=${doctorId} LIMIT 1`;
      if(!services.length){
        await sql`INSERT INTO provider_services(doctor_id,name,duration_minutes,price,currency,active)
          VALUES(${doctorId},${activity||'Servicio'},30,0,'USD',true)`;
      }

      const existingCommercial=await sql`SELECT id,status,trial_ends_at FROM commercial_clients WHERE lower(email)=lower(${email}) ORDER BY created_at DESC LIMIT 1`;
      if(existingCommercial.length){
        commercialClientId=String((existingCommercial[0] as any).id);
        await sql`UPDATE commercial_clients SET name=${name},type=${providerType},category=${category},subcategory=${activity},specialty=${activity||category},phone=${phone},auth_user_id=${String(authUserId)},
          status=CASE WHEN status IN ('SUSPENDIDO','ACTIVO','REVISION_BINANCE') THEN status ELSE 'TRIAL' END,
          trial_ends_at=CASE WHEN status IN ('SUSPENDIDO','ACTIVO','REVISION_BINANCE') THEN trial_ends_at ELSE GREATEST(COALESCE(trial_ends_at,now()),now()+interval '5 days') END
          WHERE id=${(existingCommercial[0] as any).id}`;
      }else{
        const commercial=await sql`INSERT INTO commercial_clients(name,type,category,subcategory,specialty,phone,email,status,trial_ends_at,auth_user_id)
          VALUES(${name},${providerType},${category},${activity},${activity||category},${phone},${email},'TRIAL',now()+interval '5 days',${String(authUserId)})
          RETURNING id`;
        commercialClientId=String((commercial[0] as any)?.id||'');
      }

    }else if(role==='PATIENT'){
      let internalUser=await sql`SELECT id FROM users WHERE lower(email)=lower(${email}) LIMIT 1`;
      let internalUserId=(internalUser[0] as any)?.id;
      if(!internalUserId){
        const u=await sql`INSERT INTO users(role,full_name,email,phone,active) VALUES('PATIENT',${name},${email},${phone},true) RETURNING id`;
        internalUserId=(u[0] as any)?.id;
      }else{
        await sql`UPDATE users SET full_name=${name},phone=${phone},role='PATIENT',active=true WHERE id=${internalUserId}`;
      }
      const existingPatient=await sql`SELECT id FROM patients WHERE lower(email)=lower(${email}) OR phone=${phone} ORDER BY created_at DESC LIMIT 1`;
      if(existingPatient.length){
        await sql`UPDATE patients SET user_id=${internalUserId},auth_user_id=${String(authUserId)},full_name=${name},phone=${phone},email=${email} WHERE id=${(existingPatient[0] as any).id}`;
      }else{
        await sql`INSERT INTO patients(user_id,auth_user_id,full_name,phone,email) VALUES(${internalUserId},${String(authUserId)},${name},${phone},${email})`;
      }
    }
  }

  if(sql&&authUserId){
    try{
      await sql`INSERT INTO app_notifications(auth_user_id,type,title,message,link)
        VALUES(${String(authUserId)},'INFO','Bienvenido a TUCITA',${role==='DOCTOR'?'Tu cuenta fue creada. Configura tus servicios, horarios y enlace público desde tu panel.':'Tu cuenta fue creada correctamente. Ya puedes comenzar a reservar.'},'/panel')`;
    }catch(error){console.error('TUCITA welcome notification error',error)}
  }

  const appUrl=process.env.APP_URL||'https://turnavia.vercel.app';
  const publicPath=businessPublicPath||providerPublicPath;
  const welcomeMail=await sendTransactionalEmail({
    to:email,
    subject:'Tu cuenta TUCITA fue creada',
    html:turnaviaEmail('Bienvenido a TUCITA',`<p>Hola <strong>${name}</strong>.</p><p>Tu cuenta fue creada correctamente.</p><p><strong>Usuario:</strong> ${email}</p><p>Por seguridad, tu contraseña no se envía por correo.</p>${role==='DOCTOR'&&publicPath?`<p><strong>Tu enlace público personalizado:</strong><br/><a href="${appUrl}${publicPath}">${appUrl}${publicPath}</a></p><p>Compártelo con tus clientes para que vean tus servicios, precios y horarios disponibles.</p>`:''}<p><a href="${appUrl}/ingresar">Entrar a mi panel TUCITA</a></p>${role==='DOCTOR'&&buyIntent&&commercialClientId?`<p><a href="${appUrl}/pago?client=${encodeURIComponent(commercialClientId)}">Completar activación / pago</a></p>`:''}`)
  });
  if(sql&&commercialClientId){
    try{
      await sql`INSERT INTO audit_events(action,entity_type,entity_id,metadata)
        VALUES(${welcomeMail.ok?'WELCOME_EMAIL_SENT':'WELCOME_EMAIL_FAILED'},'COMMERCIAL_CLIENT',${commercialClientId},jsonb_build_object('to',${email},'error',${welcomeMail.error||null}))`;
    }catch(error){console.error('TUCITA welcome email audit error',error)}
  }

  if(role==='DOCTOR'&&buyIntent&&commercialClientId) redirect('/pago?client='+encodeURIComponent(commercialClientId));
  redirect('/panel');
}
