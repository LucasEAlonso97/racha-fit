/*
 * ========================================
 * INVITACIÓN PENDIENTE
 * ========================================
 *
 * Un invitado nuevo abre el link, se
 * registra y muchas veces tiene que
 * confirmar el mail: al volver, la URL ya
 * no tiene ?join=. Por eso guardamos la
 * invitación en el navegador hasta usarla,
 * y además la mandamos en el link del mail
 * de confirmación (inviteRedirectUrl).
 */

export type PendingInvite = {
  code: string
  ref: string | null
}

const STORAGE_KEY = 'racha-pending-invite'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readFromUrl(): PendingInvite | null {
  const params = new URLSearchParams(
    window.location.search,
  )

  const code = params
    .get('join')
    ?.trim()
    .toUpperCase()

  if (!code) {
    return null
  }

  const ref =
    params.get('ref')?.trim() ?? null

  return {
    code,
    ref:
      ref && UUID_PATTERN.test(ref)
        ? ref
        : null,
  }
}

function readFromStorage(): PendingInvite | null {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    return raw
      ? (JSON.parse(raw) as PendingInvite)
      : null
  } catch {
    return null
  }
}

/*
 * La URL manda; si no hay nada en la URL,
 * se usa lo guardado.
 */
export function readPendingInvite() {
  const fromUrl = readFromUrl()

  if (fromUrl) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fromUrl),
      )
    } catch {
      // Sin storage: se usa solo la URL.
    }

    return fromUrl
  }

  return readFromStorage()
}

/*
 * Saca ?join= y ?ref= de la URL (sin
 * recargar) y borra lo guardado.
 */
export function clearPendingInvite() {
  try {
    window.localStorage.removeItem(
      STORAGE_KEY,
    )
  } catch {
    // Nada que borrar.
  }

  const url = new URL(window.location.href)

  url.searchParams.delete('join')
  url.searchParams.delete('ref')

  window.history.replaceState(
    {},
    '',
    `${url.pathname}${url.search}${url.hash}`,
  )
}

/*
 * URL a la que vuelve el mail de
 * confirmación: incluye la invitación
 * si hay una pendiente.
 */
export function inviteRedirectUrl() {
  const invite = readPendingInvite()

  const url = new URL(
    '/',
    window.location.origin,
  )

  if (invite) {
    url.searchParams.set(
      'join',
      invite.code,
    )

    if (invite.ref) {
      url.searchParams.set(
        'ref',
        invite.ref,
      )
    }
  }

  return url.toString()
}

/*
 * Link de invitación para compartir.
 */
export function buildInviteLink(
  inviteCode: string,
  inviterId: string,
) {
  const url = new URL(
    '/',
    window.location.origin,
  )

  url.searchParams.set('join', inviteCode)
  url.searchParams.set('ref', inviterId)

  return url.toString()
}
