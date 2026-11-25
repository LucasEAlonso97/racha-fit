import {
  RefreshCw,
} from 'lucide-react'

import {
  PULL_TRIGGER,
} from '../hooks/usePullToRefresh'

type Props = {
  pull: number
  refreshing: boolean
}

/*
 * Círculo que baja desde arriba al tirar
 * la pantalla hacia abajo en Inicio.
 */
function PullToRefreshIndicator({
  pull,
  refreshing,
}: Props) {
  if (pull <= 0 && !refreshing) {
    return null
  }

  const ready =
    pull >= PULL_TRIGGER

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[40] flex justify-center"
      style={{
        transform: `translateY(${Math.max(pull - 40, 0) + 12}px)`,
        transition: refreshing
          ? 'transform 0.2s ease-out'
          : undefined,
      }}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ${
          ready || refreshing
            ? 'text-violet-600'
            : 'text-zinc-400'
        }`}
        style={{
          opacity: Math.min(
            1,
            pull / 40,
          ),
        }}
      >
        <RefreshCw
          size={20}
          strokeWidth={2.5}
          className={
            refreshing
              ? 'animate-spin'
              : undefined
          }
          style={
            refreshing
              ? undefined
              : {
                  transform: `rotate(${pull * 3}deg)`,
                }
          }
        />
      </div>

      {refreshing && (
        <span className="sr-only">
          Actualizando
        </span>
      )}
    </div>
  )
}

export default PullToRefreshIndicator
