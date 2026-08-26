import {
  Target,
  Users,
} from 'lucide-react'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  getWeekActivityCount,
} from '../utils/activityStats'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  today: Date
}

function GroupWeeklyGoal({
  activities,
  users,
  today,
}: Props) {
  /*
   * Objetivo base:
   * 4 días activos por integrante.
   */

  const daysPerPersonGoal = 4

  const goal =
    users.length *
    daysPerPersonGoal

  /*
   * Cada integrante aporta
   * sus días activos de la semana.
   */

  const contributions =
    users.map((user) => ({
      user,

      days:
        getWeekActivityCount(
          activities,
          user.id,
          today,
        ),
    }))

  const completedDays =
    contributions.reduce(
      (
        total,
        contribution,
      ) =>
        total +
        contribution.days,
      0,
    )

  const progress =
    goal > 0
      ? Math.min(
          (
            completedDays /
            goal
          ) * 100,
          100,
        )
      : 0

  const remaining =
    Math.max(
      goal -
        completedDays,
      0,
    )

  const completed =
    goal > 0 &&
    completedDays >= goal

  return (
   <section className="mt-3 mb-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-orange-100 via-pink-50 to-violet-100 p-5 shadow-sm">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wider text-orange-500">
            OBJETIVO DE LA BANDA
          </p>

          <h2 className="mt-1 text-xl font-black text-zinc-800">
            {completed
              ? 'Objetivo cumplido 🔥'
              : 'Todos sumamos'}
          </h2>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
          <Target
            size={24}
            className="text-orange-500"
          />
        </div>
      </div>

      {/* TOTAL */}

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-black text-zinc-800">
          {completedDays}
        </span>

        <span className="mb-1 font-bold text-zinc-500">
          de {goal} días
        </span>
      </div>

      {/* BARRA */}

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full bg-orange-400 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* MENSAJE */}

      <div className="mt-3">
        {completed ? (
          <p className="text-sm font-black text-orange-600">
            🔥 La banda completó
            el objetivo semanal.
          </p>
        ) : (
          <p className="text-sm font-bold text-zinc-600">
            Faltan{' '}
            <span className="font-black text-orange-600">
              {remaining}
            </span>{' '}
            {remaining === 1
              ? 'día'
              : 'días'}{' '}
            para completarlo.
          </p>
        )}
      </div>

      {/* CONTRIBUCIÓN */}

      <div className="mt-5 border-t border-orange-200/70 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Users
            size={16}
            className="text-zinc-500"
          />

          <p className="text-xs font-black tracking-wide text-zinc-500">
            APORTE DEL GRUPO
          </p>
        </div>

        <div className="space-y-2">
          {contributions.map(
            ({
              user,
              days,
            }) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-2.5"
              >
                <p className="text-sm font-bold text-zinc-700">
                  {user.name}
                </p>

                <p className="text-sm font-black text-orange-500">
                  {days}{' '}
                  {days === 1
                    ? 'día'
                    : 'días'}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold leading-relaxed text-zinc-500">
        Cada integrante puede
        aportar hasta{' '}
        {daysPerPersonGoal} días
        al objetivo semanal.
      </p>
    </section>
  )
}

export default GroupWeeklyGoal