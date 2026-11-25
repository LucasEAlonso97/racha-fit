/*
 * ========================================
 * VERSIÓN NUEVA PUBLICADA
 * ========================================
 *
 * Dos problemas que aparecen cada vez que
 * se publica en Netlify:
 *
 * 1. Alguien tenía la app abierta. Las
 *    pantallas que se bajan recién al
 *    abrirlas (Torneos, Perfil...) apuntan
 *    a archivos de la versión anterior, que
 *    ya no existen, y fallan. Solución:
 *    recargar la app una vez, sola.
 *
 * 2. En el celu la app queda abierta días
 *    con la versión vieja. Solución: al
 *    volver a la app nos fijamos si hay una
 *    publicación nueva y mostramos un aviso
 *    con "Actualizar".
 */

const RELOAD_KEY = 'racha-chunk-reload-at'

/*
 * Recarga una sola vez cada 30 segundos,
 * para no entrar en un bucle si el
 * problema es otro (por ejemplo, sin
 * señal). Devuelve false si no recargó.
 */
export function reloadForNewVersion() {
  try {
    const last = Number(
      window.sessionStorage.getItem(
        RELOAD_KEY,
      ) ?? 0,
    )

    if (Date.now() - last < 30_000) {
      return false
    }

    window.sessionStorage.setItem(
      RELOAD_KEY,
      String(Date.now()),
    )
  } catch {
    // Sin storage: recargamos igual.
  }

  window.location.reload()

  return true
}

function isChunkError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String(error)

  return /dynamically imported module|Importing a module script failed|error loading dynamically|Failed to fetch dynamically|Unable to preload/i.test(
    message,
  )
}

/*
 * Para usar en React.lazy:
 *
 *   lazy(() => retryImport(() => import('./pages/X')))
 *
 * Si el archivo ya no existe porque hubo
 * una publicación nueva, recarga la app.
 */
export function retryImport<T>(
  load: () => Promise<T>,
) {
  return load().catch((error: unknown) => {
    if (
      isChunkError(error) &&
      navigator.onLine &&
      reloadForNewVersion()
    ) {
      // La página se está recargando.
      return new Promise<T>(() => {})
    }

    throw error
  })
}

/*
 * Vite avisa con este evento cuando no
 * puede bajar un archivo de la app.
 */
window.addEventListener(
  'vite:preloadError',
  (event) => {
    if (
      navigator.onLine &&
      reloadForNewVersion()
    ) {
      event.preventDefault()
    }
  },
)

/*
 * ----------------------------------------
 * ¿Hay una versión nueva?
 * ----------------------------------------
 *
 * Bajamos index.html (sin caché) y
 * comparamos el archivo principal de la
 * app con el que está corriendo ahora.
 */

const CHECK_EVERY_MS = 10 * 60 * 1000

let lastCheck = 0
let updateAvailable = false

const listeners =
  new Set<() => void>()

function getEntryScript(
  html: string,
) {
  return (
    html.match(
      /<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+\.js)"/,
    )?.[1] ?? null
  )
}

function getRunningScript() {
  const script =
    document.querySelector<HTMLScriptElement>(
      'script[type="module"][src*="/assets/"]',
    )

  if (!script) {
    return null
  }

  return new URL(
    script.src,
    window.location.href,
  ).pathname
}

export async function checkForNewVersion() {
  if (
    updateAvailable ||
    !navigator.onLine ||
    Date.now() - lastCheck < CHECK_EVERY_MS
  ) {
    return
  }

  const running = getRunningScript()

  // En desarrollo no hay /assets/.
  if (!running) {
    return
  }

  lastCheck = Date.now()

  try {
    const response = await fetch(
      `/?version-check=${Date.now()}`,
      {
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      return
    }

    const published = getEntryScript(
      await response.text(),
    )

    if (
      published &&
      new URL(
        published,
        window.location.href,
      ).pathname !== running
    ) {
      updateAvailable = true

      listeners.forEach((listener) =>
        listener(),
      )
    }
  } catch {
    // Sin conexión: se vuelve a intentar después.
  }
}

export function subscribeUpdate(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function isUpdateAvailable() {
  return updateAvailable
}

/*
 * Se revisa al volver a la app y cada
 * tanto si queda abierta.
 */
document.addEventListener(
  'visibilitychange',
  () => {
    if (
      document.visibilityState ===
      'visible'
    ) {
      void checkForNewVersion()
    }
  },
)

window.setInterval(() => {
  if (
    document.visibilityState ===
    'visible'
  ) {
    void checkForNewVersion()
  }
}, CHECK_EVERY_MS)
