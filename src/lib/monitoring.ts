import * as Sentry from '@sentry/react'

/*
 * ========================================
 * AVISO DE ERRORES (SENTRY)
 * ========================================
 *
 * Se activa solo si existe la variable
 * VITE_SENTRY_DSN (en .env.local y en
 * Netlify). Sin ella no se carga nada.
 *
 * Además de los errores que rompen la app,
 * manda los console.error: así llegan
 * también los errores que la app atrapa
 * y muestra como aviso ("No pudimos...").
 */

export function initMonitoring(
  dsn: string,
) {
  Sentry.init({
    dsn,
    release: `racha@${__APP_VERSION__}`,
    environment: import.meta.env.MODE,

    /*
     * Sin datos personales: solo se manda
     * el id del usuario (ver
     * setMonitoringUser).
     */
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
  })
}

export function setMonitoringUser(
  userId: string | null,
) {
  Sentry.setUser(
    userId
      ? {
          id: userId,
        }
      : null,
  )
}
