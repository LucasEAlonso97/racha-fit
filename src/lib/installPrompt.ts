/*
 * ========================================
 * INSTALAR LA APP (PWA)
 * ========================================
 *
 * Android/Chrome avisa con el evento
 * "beforeinstallprompt" que se puede
 * instalar. Puede llegar antes de que
 * React arranque, así que lo escuchamos
 * apenas se importa este archivo (desde
 * main.tsx) y lo guardamos.
 *
 * iPhone no tiene ese evento: hay que
 * explicar los pasos a mano.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
  }>
}

let deferredPrompt: InstallPromptEvent | null =
  null

let installed = false

const listeners =
  new Set<() => void>()

function notify() {
  listeners.forEach((listener) =>
    listener(),
  )
}

if (typeof window !== 'undefined') {
  window.addEventListener(
    'beforeinstallprompt',
    (event) => {
      event.preventDefault()
      deferredPrompt =
        event as InstallPromptEvent
      notify()
    },
  )

  window.addEventListener(
    'appinstalled',
    () => {
      installed = true
      deferredPrompt = null
      notify()
    },
  )
}

export function subscribeInstall(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function canPromptInstall() {
  return deferredPrompt !== null
}

/*
 * Abre el cartel nativo de Android.
 * Devuelve true si la instaló.
 */
export async function promptInstall() {
  if (!deferredPrompt) {
    return false
  }

  const promptEvent = deferredPrompt

  deferredPrompt = null
  notify()

  await promptEvent.prompt()

  const { outcome } =
    await promptEvent.userChoice

  return outcome === 'accepted'
}

/*
 * Ya se está usando como app instalada.
 */
export function isRunningInstalled() {
  if (installed) {
    return true
  }

  const iosStandalone = (
    window.navigator as Navigator & {
      standalone?: boolean
    }
  ).standalone

  return (
    window.matchMedia(
      '(display-mode: standalone)',
    ).matches || iosStandalone === true
  )
}

export function isIos() {
  const userAgent =
    window.navigator.userAgent

  return (
    /iphone|ipad|ipod/i.test(userAgent) ||
    /*
     * iPadOS se hace pasar por Mac.
     */
    (userAgent.includes('Macintosh') &&
      window.navigator.maxTouchPoints > 1)
  )
}

/*
 * ========================================
 * "AHORA NO"
 * ========================================
 *
 * Si la cierra, no insistimos por 14 días.
 */

const DISMISS_KEY =
  'racha-install-dismissed-at'

const DISMISS_DAYS = 14

export function wasInstallDismissed() {
  try {
    const value =
      window.localStorage.getItem(
        DISMISS_KEY,
      )

    if (!value) {
      return false
    }

    const elapsedDays =
      (Date.now() - Number(value)) /
      (1000 * 60 * 60 * 24)

    return elapsedDays < DISMISS_DAYS
  } catch {
    return false
  }
}

export function dismissInstall() {
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      String(Date.now()),
    )
  } catch {
    // Sin storage: no pasa nada.
  }
}
