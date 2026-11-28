import {
  useMemo,
  useState,
} from 'react'

import {
  LoaderCircle,
  Share2,
} from 'lucide-react'

import {
  showToast,
} from '../lib/feedback'

import {
  drawMilestoneCard,
  shareImage,
} from '../lib/shareCards'

import {
  getCurrentStreak,
} from '../utils/activityStats'

import {
  addDays,
  formatDateKey,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

/*
 * ========================================
 * FESTEJO DE HITOS DE RACHA
 * ========================================
 *
 * Al llegar a 7, 14, 30... días seguidos
 * aparece un festejo con botón para
 * compartir. Cada hito se festeja una vez
 * por racha: si se corta y vuelve a
 * llegar a 7, se festeja de nuevo.
 */

const MILESTONES = [
  7, 14, 30, 50, 100, 150, 200, 365,
]

const MESSAGES: Record<number, string> = {
  7: '¡Una semana entera! Ya es costumbre.',
  14: 'Dos semanas sin aflojar. Imparable.',
  30: 'Un mes completo. Esto ya es otra vida.',
  50: '50 días. Leyenda en construcción.',
  100: '¡100 días! Nivel élite.',
  150: '150 días. Ya nadie te para.',
  200: '200 días. Esto es historia.',
  365: '¡UN AÑO! Sin palabras. 🏆',
}

type Stored = {
  start: string
  milestone: number
}

type Props = {
  user: User
  groupId: string
  groupName: string
  activities: ActivitiesByDate
  today: Date
}

function readStored(key: string) {
  try {
    const raw =
      window.localStorage.getItem(key)

    return raw
      ? (JSON.parse(raw) as Stored)
      : null
  } catch {
    return null
  }
}

function MilestoneCelebration({
  user,
  groupId,
  groupName,
  activities,
  today,
}: Props) {
  const storageKey =
    `racha-milestone-${groupId}-${user.id}`

  const [dismissedKey, setDismissedKey] =
    useState<string | null>(null)

  const [sharing, setSharing] =
    useState(false)

  const pending = useMemo(() => {
    const streak = getCurrentStreak(
      activities,
      user.id,
      today,
    )

    const milestone = [...MILESTONES]
      .reverse()
      .find((value) => value <= streak)

    if (!milestone) {
      return null
    }

    /*
     * Día en que empezó esta racha:
     * identifica la racha para no
     * festejar dos veces lo mismo.
     */
    const todayKey = formatDateKey(today)

    const lastActiveDay =
      (activities[todayKey]?.[user.id]
        ?.length ?? 0) > 0
        ? today
        : addDays(today, -1)

    const start = formatDateKey(
      addDays(
        lastActiveDay,
        -(streak - 1),
      ),
    )

    const stored = readStored(storageKey)

    const alreadyCelebrated =
      stored?.start === start &&
      stored.milestone >= milestone

    if (alreadyCelebrated) {
      return null
    }

    return {
      milestone,
      start,
      id: `${start}-${milestone}`,
    }
  }, [
    activities,
    user.id,
    today,
    storageKey,
  ])

  if (
    !pending ||
    dismissedKey === pending.id
  ) {
    return null
  }

  const close = () => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          start: pending.start,
          milestone: pending.milestone,
        } satisfies Stored),
      )
    } catch {
      // Sin storage: se cierra igual.
    }

    setDismissedKey(pending.id)
  }

  const share = async () => {
    setSharing(true)

    try {
      const blob =
        await drawMilestoneCard({
          days: pending.milestone,
          name: user.name,
          groupName,
        })

      const result = await shareImage(
        blob,
        `racha-${pending.milestone}-dias.png`,
        `🔥 ${pending.milestone} días seguidos en Racha`,
      )

      if (result === 'downloaded') {
        showToast(
          'Imagen descargada. Subila a tu historia 📲',
          'success',
        )
      }

      if (result !== 'cancelled') {
        close()
      }
    } catch (error) {
      console.error(
        'Error compartiendo hito:',
        error,
      )

      showToast(
        'No pudimos generar la imagen.',
      )
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[78] flex items-center justify-center bg-gradient-to-br from-violet-600/95 via-fuchsia-600/95 to-orange-500/95 px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <div className="animate-bounce text-8xl">
          🔥
        </div>

        <p className="mt-6 text-9xl font-bold leading-none tracking-tight">
          {pending.milestone}
        </p>

        <p className="mt-2 text-3xl font-black">
          días seguidos
        </p>

        <p className="mt-4 text-lg font-semibold opacity-90">
          {MESSAGES[pending.milestone]}
        </p>

        <button
          type="button"
          disabled={sharing}
          onClick={() => void share()}
          className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-violet-600 shadow-xl transition active:scale-[0.98] disabled:opacity-70"
        >
          {sharing ? (
            <LoaderCircle
              size={20}
              className="animate-spin"
            />
          ) : (
            <Share2 size={20} />
          )}
          Compartir en historias
        </button>

        <button
          type="button"
          onClick={close}
          className="mt-3 w-full py-3 font-bold text-white/80"
        >
          Seguir
        </button>
      </div>
    </div>
  )
}

export default MilestoneCelebration
