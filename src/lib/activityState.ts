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
  return updateActivityById(
    activities,
    activityId,
    (activity) => ({
      ...activity,
      reactions,
    }),
  )
}

/*
 * Aplica cambios a una actividad buscándola
 * por id (sin saber fecha ni usuario).
 */
export function updateActivityById(
  activities: ActivitiesByDate,
  activityId: string,
  update: (activity: Activity) => Activity,
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
                  ? update(activity)
                  : activity,
            )
        },
      )
    },
  )

  return nextActivities
}

/*
 * Última actividad registrada por un usuario
 * antes de una fecha (sin incluirla).
 */
export function getLastUserActivity(
  activities: ActivitiesByDate,
  userId: string,
  beforeDateKey: string,
) {
  const dateKeys = Object.keys(activities)
    .filter(
      (dateKey) =>
        dateKey < beforeDateKey &&
        (activities[dateKey][userId]
          ?.length ?? 0) > 0,
    )
    .sort()

  const lastDate = dateKeys.at(-1)

  if (!lastDate) {
    return null
  }

  return activities[lastDate][userId].at(-1) ?? null
}

/*
 * Saca una actividad por id, esté donde esté.
 * Limpia usuarios y días que queden vacíos.
 */
export function removeActivityById(
  activities: ActivitiesByDate,
  activityId: string,
): ActivitiesByDate {
  const nextActivities: ActivitiesByDate =
    {}

  Object.entries(activities).forEach(
    ([dateKey, day]) => {
      const nextDay: ActivitiesByDate[string] =
        {}

      Object.entries(day).forEach(
        ([userId, userActivities]) => {
          const remaining =
            userActivities.filter(
              (activity) =>
                activity.id !== activityId,
            )

          if (remaining.length > 0) {
            nextDay[userId] = remaining
          }
        },
      )

      if (
        Object.keys(nextDay).length > 0
      ) {
        nextActivities[dateKey] = nextDay
      }
    },
  )

  return nextActivities
}

/*
 * Inserta o reemplaza una actividad.
 * Si ya estaba, mantiene su posición.
 */
export function upsertActivity(
  activities: ActivitiesByDate,
  dateKey: string,
  userId: string,
  activity: Activity,
): ActivitiesByDate {
  const existing =
    activities[dateKey]?.[userId]?.some(
      (current) =>
        current.id === activity.id,
    ) ?? false

  if (existing) {
    return replaceActivity(
      activities,
      dateKey,
      userId,
      activity.id!,
      activity,
    )
  }

  return addActivity(
    activity.id
      ? removeActivityById(
          activities,
          activity.id,
        )
      : activities,
    dateKey,
    userId,
    activity,
  )
}
