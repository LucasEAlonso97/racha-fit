import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import App from './App'
import FeedbackHost from './components/FeedbackHost'
import UpdateBanner from './components/UpdateBanner'
import CelebrationBurst from './components/CelebrationBurst'

/*
 * Recarga sola si falta un archivo por una
 * publicación nueva, y avisa cuando hay
 * versión nueva (ver lib/appVersion.ts).
 */
import './lib/appVersion'

/*
 * Escucha "se puede instalar" lo antes
 * posible (ver lib/installPrompt.ts).
 */
import './lib/installPrompt'

/*
 * Aviso de errores: solo si está
 * configurado (ver src/lib/monitoring.ts).
 */
const sentryDsn =
  import.meta.env.VITE_SENTRY_DSN

if (sentryDsn) {
  void import('./lib/monitoring').then(
    ({ initMonitoring }) =>
      initMonitoring(sentryDsn),
  )
}

createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <App />
    <FeedbackHost />
    <UpdateBanner />
    <CelebrationBurst />
  </StrictMode>,
)

if (
  'serviceWorker' in navigator
) {
  window.addEventListener(
    'load',
    () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log(
            'Service Worker registrado:',
            registration.scope,
          )
        })
        .catch((error) => {
          console.error(
            'Error registrando Service Worker:',
            error,
          )
        })
    },
  )
}