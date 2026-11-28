import {
  useState,
} from 'react'

import type {
  ActivitiesByDate,
} from '../types'

type StatsRange =
  | 'week'
  | 'month'
  | 'total'

type Props = {
  activities: ActivitiesByDate
  userId: string
  groupName: string
}

/*
 * ========================================
 * TUS NÚMEROS
 * ========================================
 *
 * Días, actividades, tiempo y deporte más
 * frecuente, por semana, mes o total.
 * (Antes estaba en el perfil; ahora vive en
 * Progreso → Estadísticas.)
 */
function PersonalStats({
  activities,
  userId,
  groupName,
}: Props) {
  const [
    statsRange,
    setStatsRange,
  ] =
    useState<StatsRange>(
      'week',
    )

  /*
   * ========================================
   * ESTADÍSTICAS PERSONALES
   * ========================================
   */

  const myActivities =
    Object.entries(
      activities,
    ).flatMap(
      ([
        dateKey,
        day,
      ]) =>
        (
          day[
            userId
          ] ?? []
        ).map(
          (
            activity,
          ) => ({
            ...activity,
            dateKey,
          }),
        ),
    )

  const now =
    new Date()

  now.setHours(
    23,
    59,
    59,
    999,
  )

  const startOfWeek =
    new Date()

  const currentDay =
    startOfWeek.getDay()

  const daysSinceMonday =
    currentDay ===
    0
      ? 6
      : currentDay -
        1

  startOfWeek.setDate(
    startOfWeek.getDate() -
      daysSinceMonday,
  )

  startOfWeek.setHours(
    0,
    0,
    0,
    0,
  )

  const startOfMonth =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )

  startOfMonth.setHours(
    0,
    0,
    0,
    0,
  )

  const filteredActivities =
    myActivities.filter(
      (
        activity,
      ) => {
        if (
          statsRange ===
          'total'
        ) {
          return true
        }

        const activityDate =
          new Date(
            `${activity.dateKey}T12:00:00`,
          )

        if (
          statsRange ===
          'week'
        ) {
          return (
            activityDate >=
              startOfWeek &&
            activityDate <=
              now
          )
        }

        return (
          activityDate >=
            startOfMonth &&
          activityDate <=
            now
        )
      },
    )

  const activeDays =
    new Set(
      filteredActivities.map(
        (
          activity,
        ) =>
          activity.dateKey,
      ),
    ).size

  const totalActivities =
    filteredActivities.length

  const totalMinutes =
    filteredActivities.reduce(
      (
        total,
        activity,
      ) =>
        total +
        activity.duration,
      0,
    )

  const activityCounts =
    filteredActivities.reduce<
      Record<
        string,
        number
      >
    >(
      (
        counts,
        activity,
      ) => {
        counts[
          activity.type
        ] =
          (
            counts[
              activity.type
            ] ??
            0
          ) +
          1

        return counts
      },
      {},
    )

  const favoriteActivity =
    Object.entries(
      activityCounts,
    ).sort(
      (
        a,
        b,
      ) =>
        b[1] -
        a[1],
    )[0]?.[0] ??
    '—'

  const formattedMinutes =
    totalMinutes >=
    60
      ? `${Math.floor(
          totalMinutes /
            60,
        )}h ${
          totalMinutes %
          60
        }m`
      : `${totalMinutes} min`

  return (
    <>
      {/* ================================= */}
      {/* ESTADÍSTICAS */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wider text-zinc-500">
              TUS NÚMEROS
            </p>

            <h2 className="mt-1 truncate text-lg font-black text-zinc-800">
              En {groupName}
            </h2>
          </div>

          <div className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-xl">
            📊
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'week',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
              statsRange ===
              'week'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            Semana
          </button>

          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'month',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
              statsRange ===
              'month'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            Mes
          </button>

          <button
            type="button"
            onClick={() =>
              setStatsRange(
                'total',
              )
            }
            className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
              statsRange ===
              'total'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-zinc-500'
            }`}
          >
            Total
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-violet-50 p-4">
            <p className="text-2xl font-black text-violet-600">
              {
                activeDays
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Días activos
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-2xl font-black text-zinc-800">
              {
                totalActivities
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Actividades
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-2xl font-black text-zinc-800">
              {
                formattedMinutes
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Tiempo activo
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="truncate text-lg font-black text-orange-600">
              {
                favoriteActivity
              }
            </p>

            <p className="mt-1 text-xs font-bold text-zinc-500">
              Más frecuente
            </p>
          </div>
        </div>

        {totalActivities ===
          0 && (
          <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-zinc-500">
            No tenés actividades
            registradas en este
            período.
          </p>
        )}
      </section>

    </>
  )
}

export default PersonalStats
