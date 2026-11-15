import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import App from './App'
import FeedbackHost from './components/FeedbackHost'

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