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
    emoji: '📸',
    title: 'Fotos',
    text: 'Sumá una foto a tu actividad. Se ve en el inicio y en la galería del grupo.',
  },
  {
    emoji: '💬',
    title: 'Comentarios',
    text: 'Comentá la actividad de los demás. Si te comentan, te avisamos.',
  },
  {
    emoji: '👤',
    title: 'Perfiles',
    text: 'Tocá el avatar de alguien para ver su racha, récord, fotos y últimas actividades.',
  },
  {
    emoji: '📈',
    title: 'Tu mes y tu año',
    text: 'En Rachas → Resumen: días activos, minutos, tu favorita y el ranking del período.',
  },
  {
    emoji: '🔁',
    title: 'Lo mismo que la última vez',
    text: 'Repetí tu última actividad con un solo toque.',
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
