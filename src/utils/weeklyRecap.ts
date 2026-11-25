import type {
  ActivitiesByDate,
  ActivityType,
  Mood,
  User,
} from '../types'

import {
  addDays,
  formatDateKey,
  getWeekDates,
  monthNames,
} from './date'

/*
 * ========================================
 * TU SEMANA EN 10 SEGUNDOS
 * ========================================
 *
 * Resumen de la semana pasada (lunes a
 * domingo), con lo que la app ya tiene
 * cargado.
 */

export type WeekRecap = {
  weekStart: string
  rangeLabel: string

  days: number
  minutes: number
  activitiesCount: number
  goal: number
  goalMet: boolean

  /* Días de la semana anterior, para comparar. */
  previousDays: number

  bestDay: {
    dateKey: string
    minutes: number
    type: ActivityType
  } | null

  topSport: ActivityType | null
  topMood: Mood | null

  group: {
    members: number
    membersMet: number
    totalDays: number
    mvp: {
      user: User
      days: number
    } | null
  }
}

/*
 * Lunes de la semana pasada.
 */
export function getLastWeekStart(
  today: Date,
) {
  return addDays(
    getWeekDates(today)[0],
    -7,
  )
}

function weekKeys(start: Date) {
  return Array.from(
    {
      length: 7,
    },
    (_, index) =>
      formatDateKey(
        addDays(start, index),
      ),
  )
}

function daysOf(
  activities: ActivitiesByDate,
  userId: string,
  keys: string[],
) {
  return keys.filter(
    (key) =>
      (activities[key]?.[userId] ?? [])
        .length > 0,
  ).length
}

function rangeLabel(start: Date) {
  const end = addDays(start, 6)

  const startMonth =
    monthNames[start.getMonth()].slice(0, 3)

  const endMonth =
    monthNames[end.getMonth()].slice(0, 3)

  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} al ${end.getDate()} de ${endMonth}`
    : `${start.getDate()} de ${startMonth} al ${end.getDate()} de ${endMonth}`
}

function mostCommon<T>(items: T[]) {
  const counts = new Map<T, number>()

  items.forEach((item) =>
    counts.set(
      item,
      (counts.get(item) ?? 0) + 1,
    ),
  )

  let best: T | null = null
  let bestCount = 0

  counts.forEach((count, item) => {
    if (count > bestCount) {
      best = item
      bestCount = count
    }
  })

  return best
}

export function computeWeekRecap(
  activities: ActivitiesByDate,
  users: User[],
  userId: string,
  weekStart: Date,
): WeekRecap {
  const keys = weekKeys(weekStart)

  const previousKeys = weekKeys(
    addDays(weekStart, -7),
  )

  const mine = keys.flatMap((key) =>
    (activities[key]?.[userId] ?? []).map(
      (activity) => ({
        key,
        activity,
      }),
    ),
  )

  const minutesByDay = new Map<
    string,
    number
  >()

  mine.forEach(({ key, activity }) =>
    minutesByDay.set(
      key,
      (minutesByDay.get(key) ?? 0) +
        (Number(activity.duration) || 0),
    ),
  )

  let bestDay: WeekRecap['bestDay'] =
    null

  minutesByDay.forEach((minutes, key) => {
    if (!bestDay || minutes > bestDay.minutes) {
      bestDay = {
        dateKey: key,
        minutes,
        type:
          activities[key][userId][0].type,
      }
    }
  })

  const me = users.find(
    (user) => user.id === userId,
  )

  const goal = me?.weeklyGoal ?? 4

  const days = daysOf(
    activities,
    userId,
    keys,
  )

  /*
   * Grupo
   */
  let mvp: WeekRecap['group']['mvp'] =
    null

  let membersMet = 0
  let totalDays = 0

  users.forEach((user) => {
    const userDays = daysOf(
      activities,
      user.id,
      keys,
    )

    totalDays += userDays

    if (userDays >= user.weeklyGoal) {
      membersMet += 1
    }

    if (
      userDays > 0 &&
      (!mvp || userDays > mvp.days)
    ) {
      mvp = {
        user,
        days: userDays,
      }
    }
  })

  return {
    weekStart: keys[0],
    rangeLabel: rangeLabel(weekStart),
    days,
    minutes: mine.reduce(
      (total, { activity }) =>
        total +
        (Number(activity.duration) || 0),
      0,
    ),
    activitiesCount: mine.length,
    goal,
    goalMet: days >= goal,
    previousDays: daysOf(
      activities,
      userId,
      previousKeys,
    ),
    bestDay,
    topSport: mostCommon(
      mine.map(({ activity }) => activity.type),
    ),
    topMood: mostCommon(
      mine
        .map(({ activity }) => activity.mood)
        .filter(
          (mood): mood is Mood =>
            Boolean(mood),
        ),
    ),
    group: {
      members: users.length,
      membersMet,
      totalDays,
      mvp,
    },
  }
}

/*
 * ¿Mostrarlo? Una vez por semana y por
 * grupo, si alguien del grupo se movió la
 * semana pasada.
 */
function seenKey(
  userId: string,
  groupId: string,
  weekStart: string,
) {
  return `racha-week-recap:${userId}:${groupId}:${weekStart}`
}

export function wasRecapSeen(
  userId: string,
  groupId: string,
  weekStart: string,
) {
  try {
    return (
      window.localStorage.getItem(
        seenKey(userId, groupId, weekStart),
      ) === '1'
    )
  } catch {
    return true
  }
}

export function markRecapSeen(
  userId: string,
  groupId: string,
  weekStart: string,
) {
  try {
    window.localStorage.setItem(
      seenKey(userId, groupId, weekStart),
      '1',
    )
  } catch {
    // Sin storage: se vuelve a mostrar, no pasa nada.
  }
}
