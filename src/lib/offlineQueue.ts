/*
 * ========================================
 * ACTIVIDADES SIN SEÑAL
 * ========================================
 *
 * En muchos gimnasios no hay señal. Si al
 * guardar no hay conexión, la actividad
 * queda guardada en el celu (localStorage)
 * y se manda sola cuando vuelve internet.
 *
 * Mientras tanto se muestra en la app con
 * un id "pending-..." y la marca pending,
 * para avisar que todavía no se envió.
 */

import type {
  ActivitiesByDate,
  ActivityType,
} from '../types'

import {
  addActivity,
  findActivityById,
} from './activityState'

export type QueuedActivity = {
  pendingId: string
  userId: string
  groupId: string
  dateKey: string
  type: ActivityType
  duration: number
  queuedAt: string
}

const PREFIX = 'pending-'

const STORAGE_KEY =
  'racha-offline-activities'

const listeners =
  new Set<() => void>()

function read(): QueuedActivity[] {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    const parsed: unknown = raw
      ? JSON.parse(raw)
      : []

    return Array.isArray(parsed)
      ? (parsed as QueuedActivity[])
      : []
  } catch {
    return []
  }
}

function write(
  items: QueuedActivity[],
) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    )
  } catch {
    // Sin storage: no hay cola posible.
  }

  listeners.forEach((listener) =>
    listener(),
  )
}

export function isPendingId(
  id: string | undefined,
) {
  return Boolean(
    id?.startsWith(PREFIX),
  )
}

export function getQueue(
  userId: string,
) {
  return read().filter(
    (item) => item.userId === userId,
  )
}

export function enqueueActivity(
  item: Omit<
    QueuedActivity,
    'pendingId' | 'queuedAt'
  >,
): QueuedActivity {
  const queued: QueuedActivity = {
    ...item,
    pendingId: `${PREFIX}${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  }

  write([...read(), queued])

  return queued
}

export function updateQueuedActivity(
  pendingId: string,
  changes: Pick<
    QueuedActivity,
    'type' | 'duration'
  >,
) {
  write(
    read().map((item) =>
      item.pendingId === pendingId
        ? {
            ...item,
            ...changes,
          }
        : item,
    ),
  )
}

export function removeQueuedActivity(
  pendingId: string,
) {
  write(
    read().filter(
      (item) =>
        item.pendingId !== pendingId,
    ),
  )
}

export function subscribeQueue(
  listener: () => void,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/*
 * ¿El error es por falta de conexión?
 * (Chrome: "Failed to fetch", Safari:
 * "Load failed", Firefox: "NetworkError".)
 */
export function isNetworkError(
  error: {
    message?: string
  } | null | undefined,
) {
  if (!navigator.onLine) {
    return true
  }

  return /failed to fetch|load failed|networkerror|network request failed/i.test(
    error?.message ?? '',
  )
}

/*
 * Suma a las actividades del grupo las que
 * están esperando señal.
 */
export function mergePendingActivities(
  activities: ActivitiesByDate,
  userId: string,
  groupId: string,
) {
  return getQueue(userId)
    .filter(
      (item) => item.groupId === groupId,
    )
    .reduce(
      (next, item) =>
        findActivityById(
          next,
          item.pendingId,
        )
          ? next
          : addActivity(
              next,
              item.dateKey,
              userId,
              {
                id: item.pendingId,
                type: item.type,
                duration: item.duration,
                reactions: [],
                comments: [],
                photo_url: null,
                pending: true,
              },
            ),
      activities,
    )
}

/*
 * Lo mismo pero sacándolas (para no
 * guardarlas en la caché).
 */
export function withoutPendingActivities(
  activities: ActivitiesByDate,
): ActivitiesByDate {
  const result: ActivitiesByDate = {}

  for (const [dateKey, byUser] of Object.entries(activities)) {
    for (const [userId, list] of Object.entries(byUser)) {
      const kept = list.filter(
        (activity) => !activity.pending,
      )

      if (kept.length > 0) {
        ;(result[dateKey] ??= {})[userId] = kept
      }
    }
  }

  return result
}
