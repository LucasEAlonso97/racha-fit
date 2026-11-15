import {
  WHATS_NEW,
} from '../lib/whatsNew'

/*
 * ========================================
 * NOVEDADES DE LA VERSIÓN
 * ========================================
 *
 * Contenido y lógica en src/lib/whatsNew.ts.
 */

type Props = {
  onClose: () => void
}

function WhatsNewModal({
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white px-6 pb-8 pt-7 sm:rounded-[32px]"
      >
        <p className="text-sm font-black text-violet-500">
          Racha {__APP_VERSION__}
        </p>

        <h2 className="mt-1 text-3xl font-black text-zinc-800">
          ¡Hay cosas nuevas! 🎉
        </h2>

        <ul className="mt-6 space-y-4">
          {WHATS_NEW.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                {item.emoji}
              </div>

              <div>
                <p className="font-black text-zinc-800">
                  {item.title}
                </p>

                <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
        >
          ¡Dale!
        </button>
      </div>
    </div>
  )
}

export default WhatsNewModal
