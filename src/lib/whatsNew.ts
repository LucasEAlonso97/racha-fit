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
    title: 'Tu semana en 10 segundos',
    text: 'Cada semana, al abrir la app, un resumen de la semana que pasó: tus días, tu mejor día y cómo le fue al grupo. Y lo podés compartir.',
  },
  {
    emoji: '🔥',
    title: '¿Cómo te sentiste?',
    text: 'Al cargar una actividad elegí un emoji (😫 😐 💪 🔥) y, si querés, sumá una nota corta. Tus amigos lo ven en el inicio.',
  },
  {
    emoji: '📷',
    title: 'Invitar con QR',
    text: 'En la gestión del grupo tocá "Mostrar QR": tu amigo lo escanea y entra directo.',
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
