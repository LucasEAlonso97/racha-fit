/*
 * ========================================
 * CORONAS, APODOS Y MEGÁFONO ACTIVOS
 * ========================================
 *
 * Los carga useGroupPerks (en RachaApp) y
 * los lee cualquier componente sin pasar
 * props: el avatar para la corona, el
 * perfil para el apodo, el inicio para el
 * megáfono.
 */

export type Banner = {
  id: string
  userId: string
  message: string
  expiresAt: string
}

export type PerksState = {
  crowned: Set<string>
  nicknames: Map<string, string>
  banner: Banner | null
}

let state: PerksState = {
  crowned: new Set(),
  nicknames: new Map(),
  banner: null,
}

const listeners =
  new Set<() => void>()

export function setPerksState(
  next: PerksState,
) {
  state = next

  listeners.forEach((listener) =>
    listener(),
  )
}

export function subscribePerks(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getPerksState() {
  return state
}
