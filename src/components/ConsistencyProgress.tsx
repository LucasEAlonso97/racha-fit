import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  CONSISTENCY_WEEKS,
  weeksTowardNext,
} from '../lib/consistency'

import {
  getWeekActivityCount,
} from '../utils/activityStats'

type Props = {
  run: number | null
  atCap: boolean
  user: User
  activities: ActivitiesByDate
}

/*
 * Progreso hacia el próximo comodín por
 * constancia, dentro de la tarjeta de
 * comodines del perfil.
 */
function ConsistencyProgress({
  run,
  atCap,
  user,
  activities,
}: Props) {
  if (run === null) {
    return null
  }

  const done =
    weeksTowardNext(run)

  const thisWeek =
    getWeekActivityCount(
      activities,
      user.id,
      new Date(),
    )

  const goal = user.weeklyGoal

  const thisWeekMet =
    thisWeek >= goal

  return (
    <div className="border-t border-amber-100 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black tracking-wider text-amber-600">
          COMODÍN POR CONSTANCIA
        </p>

        <p className="text-xs font-black text-zinc-600">
          {done}/{CONSISTENCY_WEEKS}{' '}
          semanas
        </p>
      </div>

      <div className="mt-3 flex gap-1.5">
        {Array.from(
          {
            length:
              CONSISTENCY_WEEKS,
          },
          (_, index) => (
            <div
              key={index}
              className={`h-2.5 flex-1 rounded-full ${
                index < done
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                  : index === done &&
                      thisWeekMet
                    ? 'bg-amber-200'
                    : 'bg-zinc-100'
              }`}
            />
          ),
        )}
      </div>

      <p className="mt-3 text-[11px] font-semibold leading-relaxed text-zinc-500">
        {atCap
          ? 'Ya tenés el máximo de 6 comodines. Tu constancia sigue contando igual.'
          : `Cumplí tu meta ${CONSISTENCY_WEEKS} semanas seguidas y ganás 1 comodín.`}
      </p>

      <p className="mt-1 text-[11px] font-bold text-zinc-600">
        {thisWeekMet
          ? `Esta semana ya está: ${thisWeek}/${goal} días ✅`
          : `Esta semana: ${thisWeek}/${goal} días`}
      </p>
    </div>
  )
}

export default ConsistencyProgress
