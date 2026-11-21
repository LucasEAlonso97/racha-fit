import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  addDays,
  formatDateKey,
  parseDateKey,
} from '../utils/date'

/*
 * ========================================
 * DESAFÍOS CON FECHA
 * ========================================
 *
 * "Desafío de enero: 20 días entre el 1 y
 * el 31". Participa todo el grupo. El
 * progreso se calcula acá, con las
 * actividades que ya están cargadas.
 */

export type Challenge = {
  id: string
  group_id: string
  title: string
  target_days: number
  starts_on: string
  ends_on: string
  created_by: string
  created_at: string
}

export type ChallengeStatus =
  | 'upcoming'
  | 'active'
  | 'finished'

export type ChallengeMemberProgress = {
  user: User
  days: number
  completed: boolean
}

export const CHALLENGE_COLUMNS =
  'id, group_id, title, target_days, starts_on, ends_on, created_by, created_at'

export const MAX_CHALLENGE_DAYS = 93

export function getChallengeStatus(
  challenge: Challenge,
  todayKey: string,
): ChallengeStatus {
  if (todayKey < challenge.starts_on) {
    return 'upcoming'
  }

  if (todayKey > challenge.ends_on) {
    return 'finished'
  }

  return 'active'
}

/*
 * Días entre dos fechas, incluyendo ambas.
 */
export function countDays(
  fromKey: string,
  toKey: string,
) {
  const DAY_MS = 24 * 60 * 60 * 1000

  return (
    Math.round(
      (parseDateKey(toKey).getTime() -
        parseDateKey(fromKey).getTime()) /
        DAY_MS,
    ) + 1
  )
}

export function getChallengeProgress(
  challenge: Challenge,
  activities: ActivitiesByDate,
  users: User[],
): ChallengeMemberProgress[] {
  const dateKeys = Object.keys(
    activities,
  ).filter(
    (dateKey) =>
      dateKey >= challenge.starts_on &&
      dateKey <= challenge.ends_on,
  )

  return users
    .map((user) => {
      const days = dateKeys.filter(
        (dateKey) =>
          (activities[dateKey][user.id]
            ?.length ?? 0) > 0,
      ).length

      return {
        user,
        days,
        completed:
          days >= challenge.target_days,
      }
    })
    .sort(
      (a, b) =>
        b.days - a.days ||
        a.user.name.localeCompare(
          b.user.name,
        ),
    )
}

/*
 * ¿Todavía le da el tiempo para llegar?
 * (días que le faltan vs. días que
 * quedan del desafío, contando hoy)
 */
export function canStillComplete(
  challenge: Challenge,
  daysDone: number,
  todayKey: string,
  activeToday: boolean,
) {
  const remainingNeeded =
    challenge.target_days - daysDone

  if (remainingNeeded <= 0) {
    return true
  }

  const from =
    todayKey < challenge.starts_on
      ? challenge.starts_on
      : todayKey

  if (from > challenge.ends_on) {
    return false
  }

  let daysLeft = countDays(
    from,
    challenge.ends_on,
  )

  /*
   * Si hoy ya sumó, hoy no cuenta
   * como día disponible.
   */
  if (
    activeToday &&
    from === todayKey
  ) {
    daysLeft -= 1
  }

  return daysLeft >= remainingNeeded
}

/*
 * Atajos para el formulario.
 */
export function getChallengePresets(
  today: Date,
) {
  const year = today.getFullYear()
  const month = today.getMonth()

  const nextMonthStart = new Date(
    year,
    month + 1,
    1,
  )

  const nextMonthEnd = new Date(
    year,
    month + 2,
    0,
  )

  const thisMonthEnd = new Date(
    year,
    month + 1,
    0,
  )

  return [
    {
      id: 'this-month',
      label: 'Lo que queda del mes',
      starts_on: formatDateKey(today),
      ends_on: formatDateKey(thisMonthEnd),
    },
    {
      id: 'next-month',
      label: 'El mes que viene',
      starts_on: formatDateKey(
        nextMonthStart,
      ),
      ends_on: formatDateKey(nextMonthEnd),
    },
    {
      id: 'next-30',
      label: 'Próximos 30 días',
      starts_on: formatDateKey(today),
      ends_on: formatDateKey(
        addDays(today, 29),
      ),
    },
  ]
}
