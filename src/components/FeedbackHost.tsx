import {
  useState,
  useSyncExternalStore,
} from 'react'

import {
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react'

import {
  dismissToast,
  getFeedbackState,
  resolveConfirm,
  subscribeFeedback,
} from '../lib/feedback'

import type {
  PendingConfirm,
  ToastVariant,
} from '../lib/feedback'

const toastStyles: Record<
  ToastVariant,
  string
> = {
  error: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
  info: 'bg-zinc-800 text-white',
}

const toastIcons = {
  error: XCircle,
  success: CheckCircle2,
  info: Info,
}

/*
 * ========================================
 * DIÁLOGO DE CONFIRMACIÓN
 * ========================================
 */

function ConfirmDialog({
  confirm,
}: {
  confirm: PendingConfirm
}) {
  const [typedText, setTypedText] =
    useState('')

  const needsText =
    confirm.requireText !== undefined

  const canConfirm =
    !needsText ||
    typedText.trim() ===
      confirm.requireText

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-5 backdrop-blur-[2px]"
      onClick={() =>
        resolveConfirm(false)
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <h2 className="text-lg font-black text-zinc-800">
          {confirm.title}
        </h2>

        {confirm.message && (
          <p className="mt-2 whitespace-pre-line text-sm text-zinc-500">
            {confirm.message}
          </p>
        )}

        {needsText && (
          <input
            autoFocus
            value={typedText}
            onChange={(event) =>
              setTypedText(
                event.target.value,
              )
            }
            placeholder={
              confirm.requireText
            }
            className="mt-4 w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-violet-400"
          />
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() =>
              resolveConfirm(false)
            }
            className="flex-1 rounded-2xl bg-zinc-100 px-4 py-3 font-bold text-zinc-600"
          >
            {confirm.cancelLabel ??
              'Cancelar'}
          </button>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              resolveConfirm(true)
            }
            className={`flex-1 rounded-2xl px-4 py-3 font-bold text-white transition disabled:opacity-40 ${
              confirm.danger
                ? 'bg-red-500'
                : 'bg-violet-500'
            }`}
          >
            {confirm.confirmLabel ??
              'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/*
 * ========================================
 * HOST
 * ========================================
 *
 * Montar una sola vez, en main.tsx.
 */

function FeedbackHost() {
  const { toasts, confirm } =
    useSyncExternalStore(
      subscribeFeedback,
      getFeedbackState,
    )

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-5">
        {toasts.map((toast) => {
          const Icon =
            toastIcons[toast.variant]

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-lg ${toastStyles[toast.variant]}`}
            >
              <Icon
                size={18}
                className="shrink-0"
              />

              <span className="flex-1">
                {toast.message}
              </span>

              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    dismissToast(toast.id)
                    toast.action?.onClick()
                  }}
                  className="shrink-0 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition active:scale-95"
                >
                  {toast.action.label}
                </button>
              )}

              <button
                type="button"
                aria-label="Cerrar aviso"
                onClick={() =>
                  dismissToast(toast.id)
                }
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {confirm && (
        <ConfirmDialog
          key={confirm.id}
          confirm={confirm}
        />
      )}
    </>
  )
}

export default FeedbackHost
