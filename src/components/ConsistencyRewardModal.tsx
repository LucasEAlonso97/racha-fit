import {
  CONSISTENCY_WEEKS,
} from '../lib/consistency'

type Props = {
  count: number
  onClose: () => void
}

/*
 * Aparece una vez cuando la app detecta que
 * ganaste un comodín por constancia.
 */
function ConsistencyRewardModal({
  count,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[77] flex items-center justify-center bg-black/40 px-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white text-center shadow-xl"
      >
        <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-fuchsia-500 px-6 pb-6 pt-8 text-white">
          <div className="mx-auto flex h-20 w-16 rotate-6 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/25 text-4xl shadow-lg">
            🃏
          </div>

          <h2 className="mt-5 text-2xl font-black">
            {count === 1
              ? '¡Ganaste un comodín!'
              : `¡Ganaste ${count} comodines!`}
          </h2>
        </div>

        <div className="px-6 pb-6 pt-5">
          <p className="text-sm font-semibold leading-relaxed text-zinc-500">
            Cumpliste tu meta{' '}
            <span className="font-bold text-orange-500">
              {CONSISTENCY_WEEKS} semanas
              seguidas
            </span>
            . Eso es constancia de
            verdad. Seguí así y en{' '}
            {CONSISTENCY_WEEKS} semanas
            más ganás otro.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-200 transition active:scale-[0.98]"
          >
            ¡Vamos! 💪
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsistencyRewardModal
