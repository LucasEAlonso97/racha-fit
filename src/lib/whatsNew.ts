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
    title: 'Abre al toque',
    text: 'Racha muestra al instante lo último que viste y trae lo nuevo de fondo. Y ahora abre aunque no tengas señal.',
  },
  {
    emoji: '🟪',
    title: 'Tu año día por día',
    text: 'En tu perfil hay un mapa con un cuadradito por día: más oscuro, más entrenaste. Tocá uno para ver qué hiciste.',
  },
  {
    emoji: '👇',
    title: 'Deslizá para cerrar',
    text: 'Las ventanas que suben desde abajo se cierran arrastrándolas hacia abajo.',
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
