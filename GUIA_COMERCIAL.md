# TURNAVIA — Guía para explicar la demo

## Frase de entrada
“Turnavia permite que el médico publique cuándo va a consultar, el paciente reserve su hora y recepción vea todo en una sola agenda.”

## 1. Médico
Ruta: `/medico`

Qué explicar:
- El médico entra desde cualquier lugar.
- Publica fecha, hora y duración de cada cita.
- Ve cuántos pacientes tiene y cuántos cupos quedan.
- Puede marcar su consulta como normal, retrasada o suspendida.
- Copia o comparte su enlace público de reservas.

Demostración recomendada:
1. Pulsa **Nueva disponibilidad**.
2. Publica un horario.
3. Pulsa **Estado** y marca 20 minutos de retraso.
4. Enseña cómo ese retraso aparece al paciente.

## 2. Paciente
Ruta: `/reservar/sofia-mendoza`

Qué explicar:
- No necesita llamar ni llegar de madrugada.
- Elige un día y una hora libre.
- Completa datos mínimos.
- Confirma y la cita aparece inmediatamente en la agenda de la clínica.

Después de reservar entra a `/paciente`:
- “Estoy en camino”.
- “Ya llegué”.
- Cancelación libera el cupo.

## 3. Recepción / Clínica
Ruta: `/recepcion`

Qué explicar:
- La recepción no desaparece; se vuelve el centro de control.
- Ve pacientes, horarios y estados.
- Registra llegada.
- Pasa al paciente a consulta.
- Finaliza o cancela.
- Puede crear una cita en nombre de un paciente que llamó por teléfono.

## 4. Master
Ruta: `/master`

Este panel es de Turnavia, no de la clínica.
Sirve para controlar clientes, médicos, mensualidades y crecimiento del SaaS.

## 5. Activación comercial
Ruta: `/activar`

Es el inicio del proceso para captar clientes.
Precio de lanzamiento definido:
- Médico independiente: $15/mes + $25 de activación.
- Clínica pequeña, hasta 5 médicos: $49/mes + $100 de activación.

## Qué todavía NO incluye
- Historia médica.
- Diagnósticos.
- Recetas.
- Exámenes.
- Facturación clínica.
- Seguros.

La primera versión resuelve agenda, disponibilidad, citas y coordinación.

## Flujo de presentación de 5 minutos
1. Landing: problema y propuesta.
2. Médico: publica disponibilidad.
3. Paciente: reserva.
4. Recepción: ve la nueva cita.
5. Paciente: marca “Estoy en camino”.
6. Recepción: registra llegada y pasa a consulta.
7. Master: mostrar que es un producto SaaS escalable.

## Mensaje comercial
“Doctor, sus pacientes pueden reservar solos y usted sabe exactamente a quién atenderá antes de llegar al consultorio. Si trabaja dentro de una clínica, recepción sigue teniendo control de toda la agenda.”

## Nuevo argumento comercial: Cita Premium Preagendada
TURNAVIA reduce citas fantasma: el profesional define el valor de la consulta, el paciente preagenda, envía comprobante y referencia, y la cita solo se confirma cuando el pago es validado. Si no asiste, dispone de una única reprogramación según disponibilidad del profesional.
