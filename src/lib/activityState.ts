import type {
  ActivitiesByDate,
  Activity,
  ActivityReaction,
} from '../types'

/*
 * ========================================
 * HELPERS INMUTABLES PARA ActivitiesByDate
 * ========================================
 *
 * Funciones puras: reciben el estado actual
 * y devuelven uno nuevo. Se usan dentro de
 * setActivities(...).
 */

export function getUserDayActivities(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
) {
  return (
    activities[dateKey]?.[userId] ?? []
  )
}

export function findActivityById(
  activities: ActivitiesByDate,
  activityId: string,
) {
  for (const day of Object.values(
    activities,
  )) {
    for (const userActivities of Object.values(
      day,
    )) {
      const found =
        userActivities.find(
          (activity) =>
            activity.id === activityId,
        )

      if (found) {
        return found
      }
    }
  }

  return null
}

export function addActivity(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
  activity: Activity,
): ActivitiesByDate {
  const currentDay =
    activities[dateKey] ?? {}

  return {
    ...activities,

    [dateKey]: {
      ...currentDay,

      [userId]: [
        ...(currentDay[userId] ?? []),
        activity,
      ],
    },
  }
}

export function replaceActivity(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
  activityId: string,
  changes: Partial<Activity>,
): ActivitiesByDate {
  const currentDay =
    activities[dateKey] ?? {}

  return {
    ...activities,

    [dateKey]: {
      ...currentDay,

      [userId]: (
        currentDay[userId] ?? []
      ).map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              ...changes,
            }
          : activity,
      ),
    },
  }
}

/*
 * Si el usuario se queda sin actividades ese día
 * se borra su entrada, y si el día queda vacío
 * se borra el día.
 */
export function removeActivity(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
  activityId: string,
): ActivitiesByDate {
  const copy = {
    ...activities,
  }

  const currentDay = {
    ...(copy[dateKey] ?? {}),
  }

  const remainingActivities = (
    currentDay[userId] ?? []
  ).filter(
    (activity) =>
      activity.id !== activityId,
  )

  if (remainingActivities.length > 0) {
    currentDay[userId] =
      remainingActivities
  } else {
    delete currentDay[userId]
  }

  if (
    Object.keys(currentDay).length === 0
  ) {
    delete copy[dateKey]
  } else {
    copy[dateKey] = currentDay
  }

  return copy
}

export function removeUserActivities(
  activities: ActivitiesByDate,
  userId: string,
): ActivitiesByDate {
  const nextActivities: ActivitiesByDate =
    {}

  Object.entries(activities).forEach(
    ([dateKey, day]) => {
      const nextDay = {
        ...day,
      }

      delete nextDay[userId]

      if (
        Object.keys(nextDay).length > 0
      ) {
        nextActivities[dateKey] = nextDay
      }
    },
  )

  return nextActivities
}

export function setActivityReactions(
  activities: ActivitiesByDate,
  activityId: string,
  reactions: ActivityReaction[],
): ActivitiesByDate {
  const nextActivities: ActivitiesByDate =
    {}

  Object.entries(activities).forEach(
    ([dateKey, day]) => {
      nextActivities[dateKey] = {}

      Object.entries(day).forEach(
        ([userId, userActivities]) => {
          nextActivities[dateKey][userId] =
            userActivities.map(
              (activity) =>
                activity.id === activityId
                  ? {
                      ...activity,
                      reactions,
                    }
                  : activity,
            )
        },
      )
    },
  )

  return nextActivities
}
