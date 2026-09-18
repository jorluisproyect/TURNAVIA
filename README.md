# TURNAVIA
MVP operativo de agenda médica digital para médico, clínica/recepción y paciente.

## Incluye
- Landing comercial
- Demo completa
- Panel Médico
- Panel Recepción / Clínica
- Panel Paciente
- Panel Master
- Reserva pública
- 5 días de prueba gratis
- Flujo PayPal automático preparado por API
- Flujo Binance con referencia + aprobación Master
- PWA
- Esquema PostgreSQL/Neon
- Manual comercial y manual PDF para cliente

## Inicio local
```bash
npm.cmd install
npm.cmd run dev
```
Abrir http://localhost:3000

## PayPal
Copia `.env.example` a `.env.local` y agrega credenciales Sandbox. La integración usa OAuth server-side + Orders API para crear y capturar el pago. No expongas el secret.

## Nota de producción
La demo comercial está lista para mostrar. Antes de manejar pacientes reales, terminar Neon, autenticación robusta, permisos, copias de seguridad, políticas de privacidad y configuración real de pagos.

## Flujo Cita Premium Preagendada
1. El médico configura precio e instrucciones de pago.
2. El paciente elige fecha y hora, paga directamente al médico/clínica, carga comprobante y referencia.
3. La cita queda `PAYMENT_REVIEW` y el cupo se preagrega.
4. Médico o recepción aprueban el pago; entonces pasa a `CONFIRMED`.
5. Si el paciente no asiste, puede marcarse `NO_SHOW` y el sistema permite una sola reprogramación, sujeta a disponibilidad.

## Backend provisioned (2026-09-17)
Neon project: TURNAVIA
- PostgreSQL schema + demo seed installed
- Managed Better Auth provisioned (email/password enabled)
- Private Object Storage bucket `payment-proofs` created
- Demo API persists bookings, payment review/approval, doctor settings, statuses and one-time rescheduling whenever `DATABASE_URL` is present

Before production deployment, set `DATABASE_URL` and payment secrets as environment variables in the hosting provider. Do not commit `.env.local`.
