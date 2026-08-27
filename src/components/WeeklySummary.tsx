import {
  CalendarDays,
  Clock3,
  Medal,
  Trophy,
} from 'lucide-react'

import {
  getBestStreak,
  getWeekActivityCount,
} from '../utils/activityStats'

import {
  formatDateKey,
  getWeekDates,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

function WeeklySummary({
  activities,
  users,
  currentUserId,
  today,
}: Props) {
  /*
   * ========================================
   * ESTADÍSTICAS PERSONALES
   * ========================================
   */

  const activeDays =
    getWeekActivityCount(
      activities,
      currentUserId,
      today,
    )

  const bestStreak =
    getBestStreak(
      activities,
      currentUserId,
    )

  /*
   * ========================================
   * MINUTOS DE ESTA SEMANA
   * ========================================
   */

  const weekDates =
    getWeekDates(today)

  const totalMinutes =
    weekDates.reduce(
      (total, date) => {
        const dateKey =
          formatDateKey(date)

        const userActivities =
          activities[
            dateKey
          ]?.[
            currentUserId
          ] ?? []

        const dayMinutes =
          userActivities.reduce(
            (
              subtotal,
              activity,
            ) =>
              subtotal +
              activity.duration,
            0,
          )

        return (
          total +
          dayMinutes
        )
      },
      0,
    )

  /*
   * ========================================
   * RANKING SEMANAL
   * ========================================
   */

  const ranking =
    users
      .map((user) => ({
        user,

        weekDays:
          getWeekActivityCount(
            activities,
            user.id,
            today,
          ),
      }))
      .sort(
        (a, b) =>
          b.weekDays -
          a.weekDays,
      )

  const position =
    ranking.findIndex(
      (item) =>
        item.user.id ===
        currentUserId,
    ) + 1

  /*
   * ========================================
   * MENSAJE
   * ========================================
   */

  const message =
    activeDays === 0
      ? 'La semana recién empieza. Tu primer día está esperando 💪'
      : position === 1
        ? 'Vas arriba esta semana. Seguí sumando 💪'
        : activeDays >= 4
          ? 'Venís con una semana fuerte. Un día más cuenta.'
          : 'Ya sumaste. Ahora vamos por el próximo día 💪'

  return (
    <section className="mb-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 p-5 shadow-sm">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div>
        <p className="text-xs font-black tracking-wider text-violet-500">
          TU SEMANA
        </p>

        <h2 className="mt-1 text-xl font-black text-zinc-800">
          Así venís 💪
        </h2>
      </div>

      {/* ================================= */}
      {/* ESTADÍSTICAS */}
      {/* ================================= */}

      <div className="mt-5 grid grid-cols-2 gap-3">
        {/* DÍAS */}

        <div className="rounded-2xl bg-white/70 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <CalendarDays
              size={19}
            />
          </div>

          <p className="mt-3 text-2xl font-black text-zinc-800">
            {activeDays}
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {activeDays === 1
              ? 'día activo'
              : 'días activos'}
          </p>
        </div>

        {/* MINUTOS */}

        <div className="rounded-2xl bg-white/70 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-pink-500">
            <Clock3
              size={19}
            />
          </div>

          <p className="mt-3 text-2xl font-black text-zinc-800">
            {totalMinutes}
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            min esta semana
          </p>
        </div>

        {/* POSICIÓN */}

        <div className="rounded-2xl bg-white/70 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
            <Medal
              size={19}
            />
          </div>

          <p className="mt-3 text-2xl font-black text-zinc-800">
            {position > 0
              ? `#${position}`
              : '-'}
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            en tu grupo
          </p>
        </div>

        {/* MEJOR RACHA */}

        <div className="rounded-2xl bg-white/70 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
            <Trophy
              size={19}
            />
          </div>

          <p className="mt-3 text-2xl font-black text-zinc-800">
            {bestStreak}
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-500">
            mejor racha
          </p>
        </div>
      </div>

      {/* ================================= */}
      {/* MENSAJE */}
      {/* ================================= */}

      <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3">
        <p className="text-sm font-bold leading-relaxed text-violet-700">
          {message}
        </p>
      </div>
    </section>
  )
}

export default WeeklySummary