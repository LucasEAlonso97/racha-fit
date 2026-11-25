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
    emoji: '🎁',
    title: 'Racha Wrapped',
    text: 'Tu año en Racha en formato historias: días, horas, deporte del año, tu compañero de racha y más. Está en tu perfil, y en diciembre también en el inicio.',
  },
  {
    emoji: '🃏',
    title: 'Comodines por constancia',
    text: 'Cumplí tu meta semanal 4 semanas seguidas y ganás un comodín. Mirá tu progreso en el perfil.',
  },
  {
    emoji: '📱',
    title: 'Adiós al zoom raro',
    text: 'En el celu la app ya no se agranda cuando escribís un comentario.',
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
