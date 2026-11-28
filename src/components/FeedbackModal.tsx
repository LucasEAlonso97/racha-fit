import {
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  LoaderCircle,
  Send,
  X,
} from 'lucide-react'

import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'

import {
  FEEDBACK_MAX_LENGTH,
  submitFeedback,
  type FeedbackKind,
} from '../lib/admin'

import {
  showToast,
} from '../lib/feedback'

type Props = {
  onClose: () => void
}

const KINDS: {
  id: FeedbackKind
  emoji: string
  label: string
  placeholder: string
}[] = [
  {
    id: 'idea',
    emoji: '💡',
    label: 'Tengo una idea',
    placeholder:
      'Me gustaría que Racha…',
  },
  {
    id: 'problem',
    emoji: '🐛',
    label: 'Algo no anda',
    placeholder:
      'Qué pasó, en qué pantalla y qué esperabas que pase.',
  },
]

/*
 * ========================================
 * SUGERIR O REPORTAR ALGO
 * ========================================
 *
 * Le llega al admin en su panel.
 */
function FeedbackModal({
  onClose,
}: Props) {
  const sheetRef =
    useSwipeToClose(onClose)

  const [kind, setKind] =
    useState<FeedbackKind>('idea')

  const [message, setMessage] =
    useState('')

  const [sending, setSending] =
    useState(false)

  const current =
    KINDS.find(
      (item) => item.id === kind,
    ) ?? KINDS[0]

  const canSend =
    message.trim().length >= 3 &&
    !sending

  const send = async () => {
    if (!canSend) {
      return
    }

    setSending(true)

    const error = await submitFeedback(
      kind,
      message.trim(),
    )

    setSending(false)

    if (error) {
      showToast(error)

      return
    }

    showToast(
      '¡Gracias! Le llegó a quien hace Racha 💜',
      'success',
    )

    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sugerir o reportar algo"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-md rounded-t-[32px] bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[32px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-violet-500">
              TU OPINIÓN
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-800">
              ¿Qué nos querés
              contar?
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={
                kind === item.id
              }
              onClick={() =>
                setKind(item.id)
              }
              className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition active:scale-95 ${
                kind === item.id
                  ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              <span className="text-lg">
                {item.emoji}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          maxLength={
            FEEDBACK_MAX_LENGTH
          }
          rows={5}
          disabled={sending}
          onChange={(event) =>
            setMessage(
              event.target.value,
            )
          }
          placeholder={
            current.placeholder
          }
          className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold leading-relaxed text-zinc-700 outline-none transition placeholder:font-semibold placeholder:text-zinc-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />

        <p className="mt-1 text-right text-xs font-bold text-zinc-500">
          {message.length}/
          {FEEDBACK_MAX_LENGTH}
        </p>

        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          {sending ? (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          ) : (
            <Send size={18} />
          )}
          Enviar
        </button>

        <p className="mt-3 text-center text-xs font-semibold text-zinc-500">
          Se envía con tu nombre, para
          poder entender mejor qué pasó.
        </p>
      </div>
    </div>,
    document.body,
  )
}

export default FeedbackModal
