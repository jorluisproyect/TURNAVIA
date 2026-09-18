# TURNAVIA - Operación comercial definida

## Qué se vende
TURNAVIA es un servicio SaaS. No se entrega el código fuente. El cliente recibe una cuenta, panel privado, enlace público de reserva y mantenimiento continuo.

## Prueba
- 5 días gratis.
- Sin tarjeta para iniciar.
- Funciones completas del plan.
- Al terminar, la cuenta pasa a pendiente de pago; no se borran datos inmediatamente.

## Precio único de lanzamiento
### Médico independiente
- Activación: USD 25
- Primer mes: USD 15
- Pago inicial para continuar después de la prueba: USD 40
- Renovación: USD 15/mes

### Clínica / consultorio (hasta 5 médicos)
- Activación: USD 100
- Primer mes: USD 49
- Pago inicial: USD 149
- Renovación: USD 49/mes

## Flujo de venta
1. Cliente entra a /activar.
2. Registra datos y comienza 5 días gratis.
3. Configura horarios y comparte su enlace.
4. Antes de vencer, entra a /pago?client=ID.
5. PayPal: TURNAVIA crea la orden en el servidor; PayPal confirma/captura; si queda COMPLETED, cuenta ACTIVA automáticamente.
6. Binance: cliente paga, registra referencia/ID y, si existe campo de comentario, usa `TURNAVIA - Nombre del médico o clínica`.
7. En Master queda REVISION_BINANCE. Se verifica en Binance y se pulsa Aprobar Binance.
8. Cliente activo continúa operando.

## Regla de seguridad de pagos
- Nunca aprobar Binance únicamente por una captura enviada por el cliente; comprobar la operación en la cuenta receptora.
- Nunca exponer PAYPAL_CLIENT_SECRET en el navegador.
- El importe se calcula en el servidor, no desde datos enviados por el navegador.

## Antes de cobrar dinero real
- Configurar credenciales PayPal reales en Vercel.
- Probar primero PayPal Sandbox.
- Configurar el dato real de Binance que se mostrará al cliente.
- Conectar Neon y autenticación segura.
- Configurar dominio, privacidad y términos.
