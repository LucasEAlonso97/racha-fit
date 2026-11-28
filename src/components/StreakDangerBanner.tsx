import {
  useEffect,
  useState,
} from 'react'

import {
  Flame,
  Plus,
  X,
} from 'lucide-react'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  dismissDangerToday,
  getStreakDanger,
  isDangerDismissedToday,
} from '../utils/streakDanger'

/*
 * ========================================
 * RACHA EN PELIGRO
 * ========================================
 *
 * A la noche (desde las 18), si todavía no
 * cargaste nada hoy y:
 *   · venías con racha (entrenaste ayer), o
 *   · si no entrenás hoy ya no llegás a tu
 *     meta de la semana,
 * aparece este cartel en Inicio con cuenta
 * regresiva hasta la medianoche.
 *
 * "Más tarde" lo esconde hasta mañana.
 * Todo dentro de la app: no manda nada
 * afuera.
 */

type Props = {
  activities: ActivitiesByDate
  user: User
  wildcardBalance: number | null
  onLogToday: () => void
  onDismiss?: () => void
}

function formatCountdown(now: Date) {
  const midnight = new Date(now)

  midnight.setHours(24, 0, 0, 0)

  const minutes = Math.max(
    0,
    Math.floor(
      (midnight.getTime() - now.getTime()) /
        60000,
    ),
  )

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return hours > 0
    ? `${hours} h ${rest} min`
    : `${rest} min`
}

function StreakDangerBanner({
  activities,
  user,
  wildcardBalance,
  onLogToday,
  onDismiss,
}: Props) {
  const [now, setNow] = useState(
    () => new Date(),
  )

  const [dismissed, setDismissed] =
    useState(() =>
      isDangerDismissedToday(new Date()),
    )

  /*
   * Reloj: cada 30 segundos.
   */
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(new Date()),
      30_000,
    )

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  if (dismissed) {
    return null
  }

  const danger = getStreakDanger(
    activities,
    user,
    now,
  )

  if (!danger) {
    return null
  }

  const dismiss = () => {
    dismissDangerToday(now)
    setDismissed(true)
    onDismiss?.()
  }

  const title =
    danger.streak >= 1
      ? `Tu racha de ${danger.streak} ${danger.streak === 1 ? 'día' : 'días'} está en peligro`
      : 'Hoy te toca sí o sí'

  const detail = danger.goalAtRisk
    ? danger.missing === 1
      ? 'Si no entrenás hoy, no llegás a tu meta de la semana.'
      : `Te faltan ${danger.missing} días para tu meta y no queda margen.`
    : 'Todavía no cargaste nada hoy.'

  return (
    <section
      role="status"
      className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 p-5 text-white shadow-lg shadow-orange-200"
    >
      <div className="pointer-events-none absolute -right-6 -top-8 text-[120px] leading-none opacity-15">
        🔥
      </div>

      <button
        type="button"
        aria-label="Más tarde"
        onClick={dismiss}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-white/85">
        <Flame
          size={15}
          className="animate-pulse"
        />
        RACHA EN PELIGRO
      </div>

      <h2 className="mt-2 pr-8 text-xl font-black leading-tight">
        {title}
      </h2>

      <p className="mt-1 text-sm font-semibold text-white/90">
        {detail}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="rounded-2xl bg-white/20 px-3 py-2 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">
            Te quedan
          </p>
          <p className="text-lg font-black tabular-nums leading-tight">
            {formatCountdown(now)}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogToday}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-bold text-orange-600 shadow-md transition active:scale-[0.98]"
        >
          <Plus
            size={18}
            strokeWidth={3}
          />
          Cargar ahora
        </button>
      </div>

      {danger.streak >= 1 &&
        (wildcardBalance ?? 0) > 0 && (
          <p className="mt-3 text-xs font-semibold text-white/85">
            🃏 Si se te pasa, mañana la
            podés salvar con un comodín
            (tenés {wildcardBalance}).
          </p>
        )}
    </section>
  )
}

export default StreakDangerBanner
