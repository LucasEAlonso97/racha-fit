/*
 * ========================================
 * AVISOS Y CONFIRMACIONES
 * ========================================
 *
 * Reemplazo de window.alert / confirm /
 * prompt. Se puede llamar desde cualquier
 * lado (hooks, componentes) sin pasar props:
 *
 *   showToast('No pudimos guardar.')
 *   const ok = await confirmAction({ ... })
 *
 * <FeedbackHost /> (montado una sola vez
 * en main.tsx) es quien los dibuja.
 */

export type ToastVariant =
  | 'error'
  | 'success'
  | 'info'

export type ToastAction = {
  label: string
  onClick: () => void
}

export type Toast = {
  id: number
  message: string
  variant: ToastVariant
  action?: ToastAction
}

export type ToastOptions = {
  /*
   * Botón dentro del aviso, por ejemplo
   * "Deshacer".
   */
  action?: ToastAction
  durationMs?: number
}

export type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string

  /*
   * Botón rojo para acciones destructivas.
   */
  danger?: boolean

  /*
   * Si se pasa, el usuario tiene que
   * escribir este texto para confirmar.
   */
  requireText?: string
}

export type PendingConfirm =
  ConfirmOptions & {
    id: number
    resolve: (confirmed: boolean) => void
  }

type FeedbackState = {
  toasts: Toast[]
  confirm: PendingConfirm | null
}

const TOAST_DURATION_MS = 3500

let state: FeedbackState = {
  toasts: [],
  confirm: null,
}

let nextId = 1

const listeners =
  new Set<() => void>()

function setState(
  nextState: FeedbackState,
) {
  state = nextState

  listeners.forEach((listener) =>
    listener(),
  )
}

export function subscribeFeedback(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getFeedbackState() {
  return state
}

/*
 * ========================================
 * TOASTS
 * ========================================
 */

export function dismissToast(
  id: number,
) {
  setState({
    ...state,
    toasts: state.toasts.filter(
      (toast) => toast.id !== id,
    ),
  })
}

export function showToast(
  message: string,
  variant: ToastVariant = 'error',
  options: ToastOptions = {},
) {
  const id = nextId++

  setState({
    ...state,
    toasts: [
      ...state.toasts,
      {
        id,
        message,
        variant,
        action: options.action,
      },
    ],
  })

  window.setTimeout(
    () => dismissToast(id),
    options.durationMs ??
      TOAST_DURATION_MS,
  )

  return id
}

/*
 * ========================================
 * CONFIRMACIÓN
 * ========================================
 *
 * Si se abre una nueva mientras hay otra
 * abierta, la anterior se cancela.
 */

export function confirmAction(
  options: ConfirmOptions,
) {
  state.confirm?.resolve(false)

  return new Promise<boolean>(
    (resolve) => {
      setState({
        ...state,
        confirm: {
          ...options,
          id: nextId++,
          resolve,
        },
      })
    },
  )
}

export function resolveConfirm(
  confirmed: boolean,
) {
  const pending = state.confirm

  if (!pending) {
    return
  }

  setState({
    ...state,
    confirm: null,
  })

  pending.resolve(confirmed)
}
