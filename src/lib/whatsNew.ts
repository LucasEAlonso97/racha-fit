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
    emoji: '🏁',
    title: 'Desafíos',
    text: 'Armá un desafío con fecha para todo el grupo: "20 días en diciembre". Está en el inicio.',
  },
  {
    emoji: '🔥',
    title: 'Festejá tus rachas',
    text: 'Al llegar a 7, 14, 30 o 100 días seguidos, festejo y una imagen para compartir.',
  },
  {
    emoji: '📲',
    title: 'Compartí en historias',
    text: 'En Rachas → Resumen podés compartir tu mes o tu año como imagen.',
  },
  {
    emoji: '📱',
    title: 'Instalala',
    text: 'Si la usás desde el navegador, ahora te explicamos cómo tenerla como app.',
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
