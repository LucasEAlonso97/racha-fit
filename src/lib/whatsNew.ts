/*
 * ========================================
 * NOVEDADES DE LA VERSIÓN
 * ========================================
 *
 * Se muestran una sola vez por versión.
 * Para una versión nueva: actualizar
 * WHATS_NEW y "version" en package.json.
 */

export const WHATS_NEW = [
  {
    emoji: '🏆',
    title: 'Premios de verdad en los torneos',
    text: 'Comodines, corona por una semana, ponerle un apodo a alguien, elegir el próximo torneo… y el raro megáfono. El premio se reclama con un botón.',
  },
  {
    emoji: '🗄️',
    title: 'Vitrina de trofeos',
    text: 'Cada torneo que ganás queda en tu perfil. Tocá el avatar de alguien para ver la suya.',
  },
  {
    emoji: '⏳',
    title: 'Los torneos ya no se traban',
    text: 'Si a quien le toca no elige en 48 horas, se elige una carta al azar. Te avisamos cuando es tu turno.',
  },
]

const STORAGE_KEY =
  'racha-whats-new-seen'

/*
 * localStorage puede fallar (modo
 * privado, etc.): en ese caso no se
 * muestra, para no insistir cada vez.
 */
export function shouldShowWhatsNew() {
  try {
    return (
      window.localStorage.getItem(
        STORAGE_KEY,
      ) !== __APP_VERSION__
    )
  } catch {
    return false
  }
}

export function markWhatsNewSeen() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      __APP_VERSION__,
    )
  } catch {
    // Sin storage: no pasa nada.
  }
}
