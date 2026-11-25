import {
  useState,
  useSyncExternalStore,
} from 'react'

import {
  RefreshCw,
  X,
} from 'lucide-react'

import {
  isUpdateAvailable,
  subscribeUpdate,
} from '../lib/appVersion'

/*
 * Aviso de "hay una versión nueva".
 * Montado una sola vez, en main.tsx.
 */
function UpdateBanner() {
  const available =
    useSyncExternalStore(
      subscribeUpdate,
      isUpdateAvailable,
    )

  const [dismissed, setDismissed] =
    useState(false)

  if (!available || dismissed) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[85] flex justify-center px-4 pt-[max(env(safe-area-inset-top),12px)]">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-xl"
      >
        <span className="text-xl">
          ✨
        </span>

        <p className="min-w-0 flex-1 text-sm font-bold leading-tight">
          Hay una versión nueva de Racha
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-500 px-3 py-2 text-xs font-black transition active:scale-95"
        >
          <RefreshCw size={14} />
          Actualizar
        </button>

        <button
          type="button"
          aria-label="Ahora no"
          onClick={() =>
            setDismissed(true)
          }
          className="shrink-0 text-white/50"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export default UpdateBanner
