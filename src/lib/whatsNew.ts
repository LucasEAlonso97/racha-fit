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
    emoji: '⚡',
    title: 'Tus propios deportes',
    text: 'Elegí "Otra" al cargar y creá tu deporte con nombre y emoji. La próxima vez ya aparece en la lista.',
  },
  {
    emoji: '🔥',
    title: 'Racha en peligro',
    text: 'A la noche, si todavía no cargaste nada, te avisamos cuánto tiempo te queda para no cortar la racha.',
  },
  {
    emoji: '📈',
    title: 'Tu progreso',
    text: 'En tu perfil, cómo venís semana a semana en los últimos 3 meses.',
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
