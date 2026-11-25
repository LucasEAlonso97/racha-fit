/*
 * ========================================
 * BORRAR CON "DESHACER"
 * ========================================
 *
 * Lo borrado desaparece al toque de la
 * pantalla, pero en la base se borra recién
 * a los pocos segundos. Si en ese tiempo se
 * toca "Deshacer", no se borra nada.
 *
 * Si la app se cierra o pasa a segundo
 * plano antes, se borra en ese momento.
 */

export const UNDO_MS = 5000

type Pending = {
  timer: number
  run: () => Promise<void>
}

const pending = new Map<
  string,
  Pending
>()

export function scheduleCommit(
  key: string,
  run: () => Promise<void>,
) {
  const timer = window.setTimeout(
    () => {
      pending.delete(key)
      void run()
    },
    UNDO_MS,
  )

  pending.set(key, {
    timer,
    run,
  })
}

/*
 * true si llegó a tiempo (no se borró).
 */
export function cancelCommit(
  key: string,
) {
  const item = pending.get(key)

  if (!item) {
    return false
  }

  window.clearTimeout(item.timer)
  pending.delete(key)

  return true
}

function flushCommits() {
  for (const [key, item] of pending) {
    window.clearTimeout(item.timer)
    pending.delete(key)
    void item.run()
  }
}

window.addEventListener(
  'pagehide',
  flushCommits,
)

document.addEventListener(
  'visibilitychange',
  () => {
    if (
      document.visibilityState ===
      'hidden'
    ) {
      flushCommits()
    }
  },
)
