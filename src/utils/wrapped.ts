import type {
  ActivitiesByDate,
  ActivityType,
  User,
} from '../types'

import {
  addDays,
  formatDateKey,
  parseDateKey,
} from './date'

/*
 * ========================================
 * RACHA WRAPPED (RESUMEN DEL AÑO)
 * ========================================
 *
 * Todo se calcula con las actividades del
 * grupo activo que la app ya tiene
 * cargadas: no hace falta nada nuevo en la
 * base de datos.
 */

export type WrappedStats = {
  year: number

  /*
   * Días distintos con al menos una
   * actividad (los recuperados con
   * comodín cuentan, y además se informan
   * aparte en wildcardsUsed).
   */
  daysTrained: number
  activitiesCount: number
  totalMinutes: number

  topSport: {
    type: ActivityType
    count: number
  } | null

  sportsTried: number

  bestStreak: number

  bestMonth: {
    month: number
    days: number
  } | null

  favoriteWeekday: {
    weekday: number
    days: number
  } | null

  buddy: {
    user: User
    sharedDays: number
  } | null

  rank: number
  membersCount: number
  /* Días entrenados sumando a todos. */
  groupDays: number

  reactionsReceived: number
  photosCount: number
  wildcardsUsed: number

  title: {
    emoji: string
    label: string
  }
}

/*
 * El Wrapped se mira en diciembre (año
 * actual) o en enero (año que terminó).
 */
export function getWrappedYear(
  today: Date,
) {
  return today.getMonth() === 0
    ? today.getFullYear() - 1
    : today.getFullYear()
}

/*
 * Banner en Inicio: del 1 de diciembre al
 * 31 de enero.
 */
export function isWrappedSeason(
  today: Date,
) {
  const month = today.getMonth()

  return month === 11 || month === 0
}

function daysOfUser(
  activities: ActivitiesByDate,
  userId: string,
  year: number,
) {
  const prefix = `${year}-`

  return Object.keys(activities)
    .filter(
      (dateKey) =>
        dateKey.startsWith(prefix) &&
        (activities[dateKey]?.[userId] ??
          []).length > 0,
    )
    .sort()
}

function longestRun(
  sortedKeys: string[],
) {
  let best = 0
  let current = 0
  let previous: string | null = null

  for (const key of sortedKeys) {
    if (
      previous &&
      formatDateKey(
        addDays(
          parseDateKey(previous),
          1,
        ),
      ) === key
    ) {
      current += 1
    } else {
      current = 1
    }

    best = Math.max(best, current)
    previous = key
  }

  return best
}

function pickTitle(
  days: number,
  bestStreak: number,
  sportsTried: number,
) {
  if (days >= 250) {
    return {
      emoji: '🦾',
      label: 'Máquina imparable',
    }
  }

  if (bestStreak >= 30) {
    return {
      emoji: '🔥',
      label: 'Fuego que no se apaga',
    }
  }

  if (days >= 150) {
    return {
      emoji: '🏅',
      label: 'Constancia de acero',
    }
  }

  if (sportsTried >= 5) {
    return {
      emoji: '🧭',
      label: 'Explorador del deporte',
    }
  }

  if (days >= 60) {
    return {
      emoji: '💪',
      label: 'En pleno envión',
    }
  }

  return {
    emoji: '🌱',
    label: 'Arrancando con todo',
  }
}

export function computeWrapped(
  activities: ActivitiesByDate,
  users: User[],
  userId: string,
  year: number,
): WrappedStats {
  const myDays = daysOfUser(
    activities,
    userId,
    year,
  )

  let activitiesCount = 0
  let totalMinutes = 0
  let reactionsReceived = 0
  let photosCount = 0
  let wildcardsUsed = 0

  const sportCounts =
    new Map<ActivityType, number>()

  const monthDays = Array<number>(12).fill(0)
  const weekdayDays = Array<number>(7).fill(0)

  for (const dateKey of myDays) {
    const date = parseDateKey(dateKey)

    monthDays[date.getMonth()] += 1
    weekdayDays[date.getDay()] += 1

    for (const activity of activities[dateKey][userId]) {
      activitiesCount += 1
      totalMinutes += Number(activity.duration) || 0
      reactionsReceived += activity.reactions?.length ?? 0

      if (activity.photo_url) {
        photosCount += 1
      }

      if (activity.recovered_with_wildcard) {
        wildcardsUsed += 1
      }

      sportCounts.set(
        activity.type,
        (sportCounts.get(activity.type) ?? 0) + 1,
      )
    }
  }

  let topSport: WrappedStats['topSport'] = null

  for (const [type, count] of sportCounts) {
    if (!topSport || count > topSport.count) {
      topSport = { type, count }
    }
  }

  const bestMonthIndex = monthDays.reduce(
    (best, days, index) =>
      days > monthDays[best] ? index : best,
    0,
  )

  const favoriteWeekdayIndex = weekdayDays.reduce(
    (best, days, index) =>
      days > weekdayDays[best] ? index : best,
    0,
  )

  /*
   * Compañero: con quién coincidiste más
   * días entrenando.
   */
  const mySet = new Set(myDays)
  let buddy: WrappedStats['buddy'] = null

  const ranking: {
    id: string
    days: number
  }[] = []


  for (const user of users) {
    const days = daysOfUser(
      activities,
      user.id,
      year,
    )

    ranking.push({
      id: user.id,
      days: days.length,
    })

    if (user.id === userId) {
      continue
    }

    const shared = days.filter((day) =>
      mySet.has(day),
    ).length

    if (
      shared > 0 &&
      (!buddy || shared > buddy.sharedDays)
    ) {
      buddy = {
        user,
        sharedDays: shared,
      }
    }
  }

  /*
   * Puesto en el grupo: los empates
   * comparten puesto.
   */
  const rank =
    1 +
    ranking.filter(
      (entry) => entry.days > myDays.length,
    ).length

  const bestStreak = longestRun(myDays)

  return {
    year,
    daysTrained: myDays.length,
    activitiesCount,
    totalMinutes,
    topSport,
    sportsTried: sportCounts.size,
    bestStreak,
    bestMonth:
      myDays.length > 0
        ? {
            month: bestMonthIndex,
            days: monthDays[bestMonthIndex],
          }
        : null,
    favoriteWeekday:
      myDays.length > 0
        ? {
            weekday: favoriteWeekdayIndex,
            days: weekdayDays[favoriteWeekdayIndex],
          }
        : null,
    buddy,
    rank,
    membersCount: Math.max(users.length, 1),
    groupDays: ranking.reduce(
      (total, entry) => total + entry.days,
      0,
    ),
    reactionsReceived,
    photosCount,
    wildcardsUsed,
    title: pickTitle(
      myDays.length,
      bestStreak,
      sportCounts.size,
    ),
  }
}

export function formatHours(
  minutes: number,
) {
  const hours = minutes / 60

  if (hours < 10) {
    return hours.toLocaleString('es-AR', {
      maximumFractionDigits: 1,
    })
  }

  return Math.round(hours).toLocaleString('es-AR')
}
