-- TURNAVIA demo seed (run after schema.sql)
INSERT INTO organizations(name,slug,type,phone,email,subscription_status,monthly_price)
VALUES('Centro Médico Caracas','centro-medico-caracas','CLINIC','0212-5550000','demo@turnavia.app','TRIAL',49)
ON CONFLICT(slug) DO NOTHING;

INSERT INTO locations(organization_id,name,address,city,state,country)
SELECT id,'Centro Médico Caracas','Av. Principal, Caracas','Caracas','Distrito Capital','Venezuela' FROM organizations WHERE slug='centro-medico-caracas'
AND NOT EXISTS(SELECT 1 FROM locations WHERE name='Centro Médico Caracas');

INSERT INTO users(organization_id,role,full_name,email,phone)
SELECT id,'DOCTOR','Dra. Sofía Mendoza','sofia.demo@turnavia.app','0412-5550101' FROM organizations WHERE slug='centro-medico-caracas'
ON CONFLICT(email) DO NOTHING;

INSERT INTO doctors(user_id,public_slug,specialty,license_number,default_appointment_minutes)
SELECT id,'sofia-mendoza','Cardiología','MPPS-DEMO-001',30 FROM users WHERE email='sofia.demo@turnavia.app'
ON CONFLICT(public_slug) DO NOTHING;

INSERT INTO doctor_locations(doctor_id,location_id,room)
SELECT d.id,l.id,'204' FROM doctors d CROSS JOIN locations l WHERE d.public_slug='sofia-mendoza' AND l.name='Centro Médico Caracas'
ON CONFLICT(doctor_id,location_id) DO NOTHING;

INSERT INTO availability_blocks(doctor_id,location_id,starts_at,ends_at,slot_minutes,published)
SELECT d.id,l.id,v.starts_at::timestamptz,v.ends_at::timestamptz,30,true FROM doctors d CROSS JOIN locations l CROSS JOIN (VALUES
 ('2026-09-18 08:00 America/Caracas','2026-09-18 12:00 America/Caracas'),
 ('2026-09-24 08:00 America/Caracas','2026-09-24 12:00 America/Caracas'),
 ('2026-09-25 08:00 America/Caracas','2026-09-25 12:00 America/Caracas')
) v(starts_at,ends_at) WHERE d.public_slug='sofia-mendoza' AND l.name='Centro Médico Caracas'
AND NOT EXISTS(SELECT 1 FROM availability_blocks a WHERE a.doctor_id=d.id AND a.starts_at=v.starts_at::timestamptz);

INSERT INTO doctor_status_updates(doctor_id,work_date,status,delay_minutes)
SELECT id,'2026-09-18','NORMAL',0 FROM doctors WHERE public_slug='sofia-mendoza'
ON CONFLICT(doctor_id,work_date) DO NOTHING;
