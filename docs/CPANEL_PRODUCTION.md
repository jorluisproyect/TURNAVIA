# TUCITA · Producción en cPanel

Configuración objetivo:

- Node.js: 20.x
- Modo: Production
- Application Root: `tucita`
- Application URL: `https://tucita.com.ve`
- Startup File: `server.js`
- Rama de producción: `main`
- Rama de pruebas: `develop` (Vercel)

## Primer despliegue

La carpeta de producción debe contener el código de la rama `main`. Después:

```bash
npm install --legacy-peer-deps --no-audit --no-fund
npm run cpanel:build
```

En cPanel se puede usar **Ejecutar NPM Install** para el primer comando y
**Ejecutar script JS / build** para ejecutar el build si el panel ofrece los scripts de package.json.

Después del build, reinicia la aplicación desde **Setup Node.js App**. En instalaciones Passenger que
soporten reinicio por archivo, también se puede crear/actualizar `tmp/restart.txt`.

## Variables de entorno de producción

No guardar secretos en Git. Configurarlos en **Setup Node.js App → Environment variables**.

Mínimo de TUCITA:

- `APP_URL=https://tucita.com.ve`
- `DATABASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- `RESEND_API_KEY` si se usa Resend
- `EMAIL_FROM`
- variables SMTP del correo del dominio si se usa SMTP

Las variables adicionales que existan en el entorno actual de producción deben copiarse a cPanel antes
de activar la aplicación.

## Flujo oficial

1. Desarrollo en `develop`.
2. Vercel construye la versión de prueba.
3. Se prueba la funcionalidad.
4. Cuando queda aprobada, se integra a `main`.
5. cPanel actualiza `main`, instala dependencias si cambiaron, ejecuta el build y reinicia la aplicación.
6. `https://tucita.com.ve` sirve la versión aprobada desde el hosting.

No se deben editar archivos de producción manualmente dentro de `tucita`, salvo configuración del servidor.
