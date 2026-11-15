import type {
  ActivitiesByDate,
  ActivityType,
  User,
} from '../types'

import {
  parseDateKey,
} from './date'

/*
 * ========================================
 * RESUMEN DE UN PERÍODO (MES O AÑO)
 * ========================================
 *
 * Las claves de fecha son 'YYYY-MM-DD', así
 * que un período se identifica por prefijo:
 *   mes -> '2026-11'
 *   año -> '2026'
 */

export type PeriodKind =
  | 'month'
  | 'year'

export type Period = {
  kind: PeriodKind
  year: number

  /*
   * 0-11. Solo se usa si kind es 'month'.
   */
  month: number
}

export type UserPeriodSummary = {
  user: User
  activeDays: number
  sessions: number
  totalMinutes: number
  favoriteType: ActivityType | null
  bestStreak: number
}

export type GroupPeriodSummary = {
  members: UserPeriodSummary[]
  activeDays: number
  totalMinutes: number
  favoriteType: ActivityType | null
  busiestWeekDay: number | null
}

export function getPeriodPrefix(
  period: Period,
) {
  if (period.kind === 'year') {
    return String(period.year)
  }

  const month = String(
    period.month + 1,
  ).padStart(2, '0')

  return `${period.year}-${month}`
}

export function shiftPeriod(
  period: Period,
  amount: number,
): Period {
  if (period.kind === 'year') {
    return {
      ...period,
      year: period.year + amount,
    }
  }

  const date = new Date(
    period.year,
    period.month + amount,
    1,
  )

  return {
    ...period,
    year: date.getFullYear(),
    month: date.getMonth(),
  }
}

function getMostFrequent<T>(
  counts: Map<T, number>,
) {
  let best: T | null = null
  let bestCount = 0

  counts.forEach((count, key) => {
    if (count > bestCount) {
      best = key
      bestCount = count
    }
  })

  return best
}

const DAY_MS = 24 * 60 * 60 * 1000

/*
 * Racha más larga de días consecutivos
 * dentro de una lista de fechas ordenada.
 */
function getLongestRun(
  sortedDateKeys: string[],
) {
  let longest = 0
  let current = 0
  let previous: Date | null = null

  sortedDateKeys.forEach((dateKey) => {
    const date = parseDateKey(dateKey)

    const isNextDay =
      previous !== null &&
      Math.round(
        (date.getTime() -
          previous.getTime()) /
          DAY_MS,
      ) === 1

    current = isNextDay
      ? current + 1
      : 1

    longest = Math.max(
      longest,
      current,
    )

    previous = date
  })

  return longest
}

export function getPeriodSummary(
  activities: ActivitiesByDate,
  users: User[],
  period: Period,
): GroupPeriodSummary {
  const prefix =
    getPeriodPrefix(period)

  const periodDates = Object.keys(
    activities,
  )
    .filter((dateKey) =>
      dateKey.startsWith(prefix),
    )
    .sort()

  const groupTypeCounts =
    new Map<ActivityType, number>()

  const weekDayCounts =
    new Map<number, number>()

  let groupMinutes = 0
  let groupActiveDays = 0

  periodDates.forEach((dateKey) => {
    const day = activities[dateKey]

    const someoneActive =
      Object.values(day).some(
        (userActivities) =>
          userActivities.length > 0,
      )

    if (!someoneActive) {
      return
    }

    groupActiveDays += 1

    const weekDay =
      parseDateKey(dateKey).getDay()

    weekDayCounts.set(
      weekDay,
      (weekDayCounts.get(weekDay) ??
        0) + 1,
    )
  })

  const members = users
    .map((user): UserPeriodSummary => {
      const typeCounts =
        new Map<ActivityType, number>()

      const userDates: string[] = []
      let sessions = 0
      let totalMinutes = 0

      periodDates.forEach((dateKey) => {
        const userActivities =
          activities[dateKey][user.id] ??
          []

        if (userActivities.length === 0) {
          return
        }

        userDates.push(dateKey)

        userActivities.forEach(
          (activity) => {
            sessions += 1
            totalMinutes +=
              activity.duration

            typeCounts.set(
              activity.type,
              (typeCounts.get(
                activity.type,
              ) ?? 0) + 1,
            )

            groupTypeCounts.set(
              activity.type,
              (groupTypeCounts.get(
                activity.type,
              ) ?? 0) + 1,
            )
          },
        )
      })

      groupMinutes += totalMinutes

      return {
        user,
        activeDays: userDates.length,
        sessions,
        totalMinutes,
        favoriteType:
          getMostFrequent(typeCounts),
        bestStreak:
          getLongestRun(userDates),
      }
    })
    .sort((a, b) => {
      if (b.activeDays !== a.activeDays) {
        return (
          b.activeDays - a.activeDays
        )
      }

      return (
        b.totalMinutes - a.totalMinutes
      )
    })

  return {
    members,
    activeDays: groupActiveDays,
    totalMinutes: groupMinutes,
    favoriteType: getMostFrequent(
      groupTypeCounts,
    ),
    busiestWeekDay:
      getMostFrequent(weekDayCounts),
  }
}

export function formatMinutes(
  minutes: number,
) {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(
    minutes / 60,
  )

  const rest = minutes % 60

  return rest === 0
    ? `${hours} h`
    : `${hours} h ${rest} min`
}
