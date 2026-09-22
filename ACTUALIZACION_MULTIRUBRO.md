# TUCITA — Actualización Multirrubro

TUCITA mantiene un solo proyecto y ahora funciona como plataforma de citas, turnos y reservas para múltiples rubros.

## Rubros
Salud, Belleza, Bienestar, Servicios profesionales, Educación, Automotriz, Hogar y técnicos, Mascotas, Deporte, Espacios y alquiler, Eventos, Servicios 18+ (solo adultos y actividades permitidas) y Otro.

## Flujo real
1. Profesional, negocio o cliente crea su cuenta.
2. El sistema conserva el nombre real ingresado.
3. El profesional configura perfil, ubicación, servicios, precios, métodos de pago y disponibilidad.
4. Cada profesional obtiene su URL pública /reservar/{slug}.
5. El cliente elige servicio, fecha y hora, registra pago y comprobante.
6. El profesional revisa y aprueba/rechaza el pago.
7. La reserva cambia de estado y aparece en ambos paneles.
8. Master administra clientes, profesionales y suscripciones.

## Demo
Abrir /demo. La demo está precargada y no modifica los datos reales. Incluye salud, barbería, spa, uñas, contabilidad, automotriz, mascotas y una categoría 18+ discreta.

## Desarrollo local en Windows
Si PowerShell bloquea npm.ps1, usar:
- npm.cmd install
- npm.cmd run dev

Luego abrir http://localhost:3000/demo

## Importante
No borrar ni reemplazar .env.local al actualizar una instalación que ya tenga las variables reales de Neon/Auth/Resend.
