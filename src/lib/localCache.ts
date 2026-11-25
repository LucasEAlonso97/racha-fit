/*
 * ========================================
 * LO ÚLTIMO QUE SE VIO, GUARDADO EN EL CELU
 * ========================================
 *
 * Al abrir, la app muestra al toque lo que
 * había la última vez y en paralelo trae lo
 * nuevo. Si no hay señal, se queda con lo
 * guardado.
 *
 * Al cerrar sesión se borra todo.
 */

const PREFIX = 'racha-cache:'

/*
 * El celu da ~5 MB para todo el sitio.
 * Si un grupo es muy grande, no se guarda
 * (la app anda igual, solo que sin este
 * atajo).
 */
const MAX_CHARS = 2_000_000

export function readCache<T>(
  key: string,
): T | null {
  try {
    const raw =
      window.localStorage.getItem(
        PREFIX + key,
      )

    return raw
      ? (JSON.parse(raw) as T)
      : null
  } catch {
    return null
  }
}

export function writeCache(
  key: string,
  value: unknown,
) {
  try {
    const raw = JSON.stringify(value)

    if (raw.length > MAX_CHARS) {
      window.localStorage.removeItem(
        PREFIX + key,
      )

      return
    }

    window.localStorage.setItem(
      PREFIX + key,
      raw,
    )
  } catch {
    // Lleno o bloqueado: seguimos sin guardar.
  }
}

export function clearAllCaches() {
  try {
    Object.keys(window.localStorage)
      .filter((key) =>
        key.startsWith(PREFIX),
      )
      .forEach((key) =>
        window.localStorage.removeItem(
          key,
        ),
      )
  } catch {
    // Nada que hacer.
  }
}
