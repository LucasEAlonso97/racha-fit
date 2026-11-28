import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  getCurrentStreak,
  getWeekActivityCount,
} from './activityStats'

import {
  formatDateKey,
} from './date'

/*
 * Racha en peligro: desde qué hora se avisa.
 */
export const DANGER_FROM_HOUR = 18

/*
 * Lo que hay que mostrar ahora (o null).
 */
export function getStreakDanger(
  activities: ActivitiesByDate,
  user: User,
  now: Date,
) {
  if (now.getHours() < DANGER_FROM_HOUR) {
    return null
  }

  const todayKey = formatDateKey(now)

  if (
    (activities[todayKey]?.[user.id] ?? [])
      .length > 0
  ) {
    return null
  }

  const streak = getCurrentStreak(
    activities,
    user.id,
    now,
  )

  /*
   * Días que quedan en la semana contando
   * hoy (lunes = 7 ... domingo = 1).
   */
  const daysLeft =
    7 - ((now.getDay() + 6) % 7)

  const weekDays = getWeekActivityCount(
    activities,
    user.id,
    now,
  )

  const missing = Math.max(
    0,
    user.weeklyGoal - weekDays,
  )

  const goalAtRisk =
    missing > 0 && missing >= daysLeft

  if (streak < 1 && !goalAtRisk) {
    return null
  }

  return {
    streak,
    goalAtRisk,
    missing,
  }
}


/*
 * "Más tarde": se esconde hasta mañana.
 */
const DISMISS_KEY =
  'racha-streak-danger-dismissed'

export function isDangerDismissedToday(
  now: Date,
) {
  try {
    return (
      window.localStorage.getItem(
        DISMISS_KEY,
      ) === formatDateKey(now)
    )
  } catch {
    return false
  }
}

export function dismissDangerToday(
  now: Date,
) {
  try {
    window.localStorage.setItem(
      DISMISS_KEY,
      formatDateKey(now),
    )
  } catch {
    // Sin storage: se esconde hasta recargar.
  }
}
