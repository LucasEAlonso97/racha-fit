/*
 * ========================================
 * FESTEJOS CHIQUITOS
 * ========================================
 *
 *   celebrate()   -> lluvia de fueguitos +
 *                    vibración (al cargar
 *                    la actividad del día)
 *   tapFeedback() -> vibración cortita (al
 *                    reaccionar)
 *
 * La vibración solo anda en Android (el
 * iPhone no la permite desde la web).
 * <CelebrationBurst /> (en main.tsx) dibuja
 * la animación.
 */

export type Burst = {
  id: number
  emoji: string
}

let burst: Burst | null = null
let nextId = 1

const listeners =
  new Set<() => void>()

function vibrate(
  pattern: number | number[],
) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Algunos navegadores lo bloquean.
  }
}

export function celebrate(
  emoji = '🔥',
) {
  vibrate([25, 50, 45])

  burst = {
    id: nextId++,
    emoji,
  }

  listeners.forEach((listener) =>
    listener(),
  )
}

export function tapFeedback() {
  vibrate(12)
}

export function clearBurst() {
  burst = null

  listeners.forEach((listener) =>
    listener(),
  )
}

export function subscribeBurst(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getBurst() {
  return burst
}
