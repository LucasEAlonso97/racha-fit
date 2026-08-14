import type {
  ActivitiesByDate,
} from '../types'

import {
  addDays,
  formatDateKey,
  getWeekDates,
  parseDateKey,
} from './date'

function hasActivity(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
) {
  return (
    (
      activities[
        dateKey
      ]?.[
        userId
      ] ?? []
    ).length > 0
  )
}

export function getWeekActivityCount(
  activities: ActivitiesByDate,
  userId: string,
  today: Date,
) {
  return getWeekDates(
    today,
  ).filter(
    (date) => {
      const key =
        formatDateKey(
          date,
        )

      return hasActivity(
        activities,
        key,
        userId,
      )
    },
  ).length
}

export function getCurrentStreak(
  activities: ActivitiesByDate,
  userId: string,
  today: Date,
) {
  let cursor =
    new Date(today)

  const todayKey =
    formatDateKey(
      today,
    )

  const hasActivityToday =
    hasActivity(
      activities,
      todayKey,
      userId,
    )

  if (
    !hasActivityToday
  ) {
    cursor =
      addDays(
        cursor,
        -1,
      )
  }

  let streak = 0

  while (true) {
    const key =
      formatDateKey(
        cursor,
      )

    if (
      !hasActivity(
        activities,
        key,
        userId,
      )
    ) {
      break
    }

    streak += 1

    cursor =
      addDays(
        cursor,
        -1,
      )
  }

  return streak
}

export function getBestStreak(
  activities: ActivitiesByDate,
  userId: string,
) {
  const activityDates =
    Object.keys(
      activities,
    )
      .filter(
        (dateKey) =>
          hasActivity(
            activities,
            dateKey,
            userId,
          ),
      )
      .sort()

  if (
    activityDates.length ===
    0
  ) {
    return 0
  }

  let longest = 1
  let current = 1

  for (
    let index = 1;
    index <
    activityDates.length;
    index++
  ) {
    const previousDate =
      parseDateKey(
        activityDates[
          index - 1
        ],
      )

    const currentDate =
      parseDateKey(
        activityDates[
          index
        ],
      )

    const difference =
      Math.round(
        (
          currentDate.getTime() -
          previousDate.getTime()
        ) /
          86400000,
      )

    if (
      difference === 1
    ) {
      current += 1
    } else {
      current = 1
    }

    longest =
      Math.max(
        longest,
        current,
      )
  }

  return longest
}