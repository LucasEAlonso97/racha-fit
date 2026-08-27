import {
  Target,
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
  const daysPerPersonGoal = 4

  const goal =
    users.length *
    daysPerPersonGoal

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
    <section className="mb-5 rounded-[28px] bg-gradient-to-br from-orange-100 via-pink-50 to-violet-100 p-5 shadow-sm">
      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-wider text-orange-500">
            OBJETIVO DE LA BANDA
          </p>

          <h2 className="mt-1 text-xl font-black text-zinc-800">
            {completed
              ? 'Objetivo cumplido 🏆'
              : 'Todos sumamos'}
          </h2>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
          <Target
            size={22}
            className="text-orange-500"
          />
        </div>
      </div>

      {/* PROGRESO */}

      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-black text-zinc-800">
          {completedDays}
        </span>

        <span className="mb-1 text-sm font-bold text-zinc-500">
          de {goal} días
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full bg-orange-400 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* ESTADO */}

      <p className="mt-2 text-sm font-bold text-zinc-600">
        {completed ? (
          <>
            La banda completó el objetivo semanal 💪
          </>
        ) : (
          <>
            Faltan{' '}
            <span className="font-black text-orange-600">
              {remaining}
            </span>{' '}
            {remaining === 1
              ? 'día'
              : 'días'}{' '}
            para completarlo
          </>
        )}
      </p>

      {/* APORTES */}

      <div className="mt-4 flex flex-wrap gap-2">
        {contributions.map(
          ({
            user,
            days,
          }) => (
            <div
              key={user.id}
              className="rounded-full bg-white/70 px-3 py-2 text-xs font-bold text-zinc-600"
            >
              {user.name}{' '}
              <span className="font-black text-orange-500">
                {days}
              </span>
            </div>
          ),
        )}
      </div>

      <p className="mt-3 text-[11px] font-semibold text-zinc-400">
        Hasta {daysPerPersonGoal} días por persona
      </p>
    </section>
  )
}

export default GroupWeeklyGoal