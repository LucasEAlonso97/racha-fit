/*
 * ========================================
 * PANELES SOCIALES (PERFIL AJENO / GALERÍA)
 * ========================================
 *
 * Se abren desde cualquier pantalla sin
 * pasar props:
 *
 *   openMemberProfile(userId)
 *   openGroupGallery()
 *
 * <SocialPanelsHost /> (en RachaApp) los
 * dibuja con los datos del grupo activo.
 */

export type SocialPanel =
  | { kind: 'member'; userId: string }
  | { kind: 'gallery' }
  | null

let panel: SocialPanel = null

const listeners =
  new Set<() => void>()

function setPanel(next: SocialPanel) {
  panel = next

  listeners.forEach((listener) =>
    listener(),
  )
}

export function subscribeSocialPanel(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getSocialPanel() {
  return panel
}

export function openMemberProfile(
  userId: string,
) {
  setPanel({
    kind: 'member',
    userId,
  })
}

export function openGroupGallery() {
  setPanel({
    kind: 'gallery',
  })
}

export function closeSocialPanel() {
  setPanel(null)
}
