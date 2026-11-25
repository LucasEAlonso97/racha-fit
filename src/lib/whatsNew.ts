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
    emoji: '📶',
    title: 'Funciona sin señal',
    text: '¿Sin internet en el gimnasio? Cargá tu actividad igual: se guarda en el celu y se envía sola cuando vuelve la conexión.',
  },
  {
    emoji: '↩️',
    title: 'Deshacer',
    text: 'Si borrás una actividad o un comentario por error, tocá "Deshacer" y vuelve.',
  },
  {
    emoji: '🔥',
    title: 'Más festejo',
    text: 'Fueguitos cada vez que cargás el día. Y la app te avisa cuando hay una versión nueva.',
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
