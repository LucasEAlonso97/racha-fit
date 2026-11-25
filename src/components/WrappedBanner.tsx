import {
  ChevronRight,
} from 'lucide-react'

import {
  openWrapped,
} from '../lib/socialPanels'

import {
  getWrappedYear,
  isWrappedSeason,
} from '../utils/wrapped'

type Props = {
  today: Date

  /*
   * 'home': solo en diciembre y enero.
   * 'profile': siempre (en el resto del
   * año muestra "hasta ahora").
   */
  place: 'home' | 'profile'
}

function WrappedBanner({
  today,
  place,
}: Props) {
  const inSeason =
    isWrappedSeason(today)

  if (place === 'home' && !inSeason) {
    return null
  }

  const year =
    getWrappedYear(today)

  return (
    <button
      type="button"
      onClick={() => openWrapped(year)}
      className="mb-5 flex w-full items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 p-5 text-left text-white shadow-lg shadow-fuchsia-200 transition active:scale-[0.98]"
    >
      <div className="flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white/25 text-3xl">
        🎁
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-black tracking-wider text-white/80">
          RACHA WRAPPED {year}
        </p>

        <p className="mt-0.5 text-lg font-black leading-tight">
          {inSeason
            ? `Mirá tu ${year} en Racha`
            : `Tu ${year} hasta ahora`}
        </p>
      </div>

      <ChevronRight
        size={22}
        className="shrink-0"
      />
    </button>
  )
}

export default WrappedBanner
