import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react'

import {
  addActivity,
  findActivityById,
  removeActivityById,
} from '../lib/activityState'

import {
  showToast,
} from '../lib/feedback'

import {
  getQueue,
  isNetworkError,
  mergePendingActivities,
  removeQueuedActivity,
} from '../lib/offlineQueue'

import {
  supabase,
} from '../lib/supabase'

import {
  getCreateActivityErrorMessage,
  moodPayload,
} from './useActivityActions'

import type {
  ActivitiesByDate,
  ActivityType,
} from '../types'

type Options = {
  userId: string
  activeGroupId: string | null

  /*
   * true cuando ya cargaron las actividades
   * del grupo activo.
   */
  ready: boolean

  setActivities: Dispatch<
    SetStateAction<ActivitiesByDate>
  >
  refreshWildcards: () => Promise<unknown>
}

/*
 * ========================================
 * ENVIAR LO GUARDADO SIN SEÑAL
 * ========================================
 *
 * - Al cargar el grupo, muestra sus
 *   actividades pendientes.
 * - Al volver internet (o la app), las
 *   manda una por una.
 */
export function useOfflineSync({
  userId,
  activeGroupId,
  ready,
  setActivities,
  refreshWildcards,
}: Options) {
  const syncing = useRef(false)

  const activeGroupRef =
    useRef(activeGroupId)

  useEffect(() => {
    activeGroupRef.current =
      activeGroupId
  }, [activeGroupId])

  /*
   * Mostrar las pendientes del grupo.
   */
  useEffect(() => {
    if (!ready || !activeGroupId) {
      return
    }

    setActivities((current) =>
      mergePendingActivities(
        current,
        userId,
        activeGroupId,
      ),
    )
  }, [
    ready,
    activeGroupId,
    userId,
    setActivities,
  ])

  const sync = useCallback(async () => {
    if (
      syncing.current ||
      !navigator.onLine
    ) {
      return
    }

    const queue = getQueue(userId)

    if (queue.length === 0) {
      return
    }

    syncing.current = true

    let sent = 0
    let usedWildcard = false

    try {
      for (const item of queue) {
        const { data, error } =
          await supabase
            .from('activities')
            .insert({
              user_id: item.userId,
              group_id: item.groupId,
              activity_date: item.dateKey,
              type: item.type,
              duration: item.duration,
              ...moodPayload(item),
            })
            .select(
              'id, type, duration, recovered_with_wildcard',
            )
            .single()

        if (error || !data) {
          if (isNetworkError(error)) {
            // Sigue sin señal: después se reintenta.
            break
          }

          console.error(
            'Error enviando actividad pendiente:',
            error,
          )

          removeQueuedActivity(
            item.pendingId,
          )

          setActivities((current) =>
            removeActivityById(
              current,
              item.pendingId,
            ),
          )

          showToast(
            `No pudimos enviar tu actividad sin señal: ${getCreateActivityErrorMessage(
              error?.message,
            )}`,
          )

          continue
        }

        removeQueuedActivity(
          item.pendingId,
        )

        sent += 1

        if (data.recovered_with_wildcard) {
          usedWildcard = true
        }

        if (
          item.groupId ===
          activeGroupRef.current
        ) {
          setActivities((current) => {
            const without =
              removeActivityById(
                current,
                item.pendingId,
              )

            /*
             * Puede haber llegado antes por
             * tiempo real.
             */
            if (
              findActivityById(
                without,
                data.id,
              )
            ) {
              return without
            }

            return addActivity(
              without,
              item.dateKey,
              userId,
              {
                id: data.id,
                type: data.type as ActivityType,
                duration: data.duration,
                recovered_with_wildcard:
                  data.recovered_with_wildcard,
                reactions: [],
                comments: [],
                photo_url: null,
                ...moodPayload(item),
              },
            )
          })
        }
      }
    } finally {
      syncing.current = false
    }

    if (sent > 0) {
      showToast(
        sent === 1
          ? 'Se envió tu actividad guardada sin señal ✅'
          : `Se enviaron ${sent} actividades guardadas sin señal ✅`,
        'success',
      )
    }

    if (usedWildcard) {
      await refreshWildcards()
    }
  }, [
    userId,
    setActivities,
    refreshWildcards,
  ])

  useEffect(() => {
    if (!ready) {
      return
    }

    void sync()

    const onVisible = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        void sync()
      }
    }

    const onOnline = () => {
      void sync()
    }

    window.addEventListener(
      'online',
      onOnline,
    )

    document.addEventListener(
      'visibilitychange',
      onVisible,
    )

    return () => {
      window.removeEventListener(
        'online',
        onOnline,
      )

      document.removeEventListener(
        'visibilitychange',
        onVisible,
      )
    }
  }, [ready, sync])
}
