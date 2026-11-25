import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  removeActivityById,
  removeUserActivities,
  upsertActivity,
} from '../lib/activityState'

import {
  fetchActivityById,
  fetchDayDetails,
  fetchGroupData,
  mapActivityRows,
  mapMembersToUsers,
} from '../lib/groupData'

import {
  supabase,
} from '../lib/supabase'

import {
  readCache,
  writeCache,
} from '../lib/localCache'

import {
  isNetworkError,
  mergePendingActivities,
  withoutPendingActivities,
} from '../lib/offlineQueue'

type GroupCache = {
  users: User[]
  activities: ActivitiesByDate
}

function groupCacheKey(
  groupId: string,
  userId: string,
) {
  return `group:${groupId}:${userId}`
}

import type {
  ActivitiesByDate,
  Group,
  User,
} from '../types'

/*
 * ========================================
 * DATOS DEL GRUPO ACTIVO
 * ========================================
 *
 * Miembros + actividades, con Realtime para
 * refrescar cuando alguien registra algo,
 * reacciona o cambia su objetivo.
 */

export function useGroupData(
  activeGroup: Group | null,
  currentUserId: string,
) {
  const groupId =
    activeGroup?.id ?? null

  const groupName =
    activeGroup?.name ?? null

  const [users, setUsers] =
    useState<User[]>([])

  const [activities, setActivities] =
    useState<ActivitiesByDate>({})

  const [loading, setLoading] =
    useState(false)

  /*
   * refreshKey: recarga completa
   * (miembros + todo el historial).
   * Solo al entrar al grupo o ante cambios
   * de integrantes.
   *
   * syncKey: re-sincroniza el historial
   * semanal en la base cuando cambia
   * alguna actividad.
   */
  const [refreshKey, setRefreshKey] =
    useState(0)

  const [syncKey, setSyncKey] =
    useState(0)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * LOADING AL CAMBIAR DE GRUPO
   */

  useEffect(() => {
    if (!groupId) {
      return
    }

    setLoading(true)
  }, [groupId])

  /*
   * MIEMBROS + ACTIVIDADES
   */

  useEffect(() => {
    if (!groupId) {
      setUsers([])
      setActivities({})

      return
    }

    let cancelled = false

    const loadGroupData = async () => {
      setError(null)

      /*
       * Primero lo guardado en el celu (se
       * ve al toque); después lo nuevo.
       */
      const cached =
        refreshKey === 0
          ? readCache<GroupCache>(
              groupCacheKey(
                groupId,
                currentUserId,
              ),
            )
          : null

      if (cached) {
        setUsers(cached.users)
        setActivities(
          mergePendingActivities(
            cached.activities,
            currentUserId,
            groupId,
          ),
        )
        setLoading(false)
      }

      const [
        membersResult,
        activitiesResult,
      ] =
        await fetchGroupData(groupId)

      if (cancelled) {
        return
      }

      /*
       * Sin señal pero con lo guardado: nos
       * quedamos con eso.
       */
      if (
        cached &&
        (membersResult.error ||
          activitiesResult.error) &&
        isNetworkError(
          membersResult.error ??
            activitiesResult.error,
        )
      ) {
        console.warn(
          'Sin conexión: mostrando lo último guardado.',
        )

        return
      }

      if (membersResult.error) {
        console.error(
          'Error cargando miembros:',
          membersResult.error,
        )

        setError(
          'No pudimos cargar los integrantes.',
        )
        setLoading(false)

        return
      }

      if (activitiesResult.error) {
        console.error(
          'Error cargando actividades:',
          activitiesResult.error,
        )

        setError(
          'No pudimos cargar las actividades.',
        )
        setLoading(false)

        return
      }

      setUsers(
        mapMembersToUsers(
          membersResult.data,
          currentUserId,
        ),
      )

      setActivities(
        mergePendingActivities(
          mapActivityRows(
            activitiesResult.data,
          ),
          currentUserId,
          groupId,
        ),
      )

      setLoading(false)
    }

    void loadGroupData()

    return () => {
      cancelled = true
    }
  }, [
    groupId,
    currentUserId,
    refreshKey,
  ])

  /*
   * REALTIME
   */

  useEffect(() => {
    if (!groupId) {
      return
    }

    const refreshGroup = () => {
      setRefreshKey(
        (current) => current + 1,
      )
    }

    const bumpSync = () => {
      setSyncKey(
        (current) => current + 1,
      )
    }

    /*
     * Trae solo la actividad que cambió.
     * Si algo falla, recarga todo.
     */
    const refreshActivity = async (
      activityId: string,
    ) => {
      const result =
        await fetchActivityById(
          groupId,
          activityId,
        )

      if (result.status === 'error') {
        refreshGroup()

        return
      }

      setActivities((current) =>
        result.status === 'missing'
          ? removeActivityById(
              current,
              activityId,
            )
          : upsertActivity(
              current,
              result.dateKey,
              result.userId,
              result.activity,
            ),
      )
    }

    type ChangePayload = {
      eventType: string
      new: Record<string, unknown>
      old: Record<string, unknown>
    }

    const getField = (
      payload: ChangePayload,
      field: string,
    ) => {
      const value =
        payload.new?.[field] ??
        payload.old?.[field]

      return typeof value === 'string'
        ? value
        : null
    }

    /*
     * Cambio en una actividad del grupo.
     */
    const handleActivityChange = (
      payload: ChangePayload,
    ) => {
      bumpSync()

      const activityId = getField(
        payload,
        'id',
      )

      if (!activityId) {
        refreshGroup()

        return
      }

      if (payload.eventType === 'DELETE') {
        setActivities((current) =>
          removeActivityById(
            current,
            activityId,
          ),
        )

        return
      }

      void refreshActivity(activityId)
    }

    /*
     * Reacción o comentario: se refresca
     * la actividad a la que pertenece.
     * (Si es de otro grupo, la consulta
     * no la encuentra y no pasa nada.)
     */
    const handleChildChange = (
      payload: ChangePayload,
    ) => {
      const activityId = getField(
        payload,
        'activity_id',
      )

      if (!activityId) {
        refreshGroup()

        return
      }

      void refreshActivity(activityId)
    }

    const channel = supabase
      .channel(`racha-group-${groupId}`)

      /*
       * ACTIVIDADES
       */
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `group_id=eq.${groupId}`,
        },
        handleActivityChange,
      )

      /*
       * MIEMBROS
       *
       * Recarga completa: es raro y cambia
       * nombres, objetivos y quién está.
       */
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
        },
        refreshGroup,
      )

      /*
       * REACCIONES
       */
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_reactions',
        },
        handleChildChange,
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            'Racha Realtime conectado:',
            groupName,
          )
        }
      })

    /*
     * COMENTARIOS
     *
     * Canal aparte: si la tabla todavía
     * no existe (migración sin correr),
     * falla solo este y no el de arriba.
     */
    const commentsChannel = supabase
      .channel(`racha-comments-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_comments',
        },
        handleChildChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(
        channel,
      )

      void supabase.removeChannel(
        commentsChannel,
      )
    }
  }, [
    groupId,
    groupName,
  ])

  /*
   * SINCRONIZAR HISTORIAL DE LA RACHA
   */

  useEffect(() => {
    if (!groupId) {
      return
    }

    const syncHistory = async () => {
      const { error: syncError } =
        await supabase.rpc(
          'sync_group_week_history',
          {
            p_group_id: groupId,
          },
        )

      if (syncError) {
        console.error(
          'Error sincronizando historial grupal:',
          syncError,
        )
      }
    }

    void syncHistory()
  }, [
    groupId,
    refreshKey,
    syncKey,
  ])

  /*
   * LIMPIAR (al cambiar o abandonar grupo)
   */

  const clear = () => {
    setUsers([])
    setActivities({})
  }

  /*
   * MIEMBRO EXPULSADO
   */

  const removeMember = (
    userId: string,
  ) => {
    setUsers((currentUsers) =>
      currentUsers.filter(
        (user) => user.id !== userId,
      ),
    )

    setActivities((currentActivities) =>
      removeUserActivities(
        currentActivities,
        userId,
      ),
    )
  }

  /*
   * GUARDAR EN EL CELU
   *
   * Cada vez que cambian los datos (con un
   * segundo de espera para no escribir a
   * cada rato).
   */

  useEffect(() => {
    if (
      !groupId ||
      loading ||
      error ||
      users.length === 0
    ) {
      return
    }

    const timer = window.setTimeout(
      () => {
        writeCache(
          groupCacheKey(
            groupId,
            currentUserId,
          ),
          {
            users,
            activities:
              withoutPendingActivities(
                activities,
              ),
          } satisfies GroupCache,
        )
      },
      1000,
    )

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    groupId,
    currentUserId,
    users,
    activities,
    loading,
    error,
  ])

  /*
   * DÍA VIEJO: COMPLETAR COMENTARIOS
   */

  const activitiesRef =
    useRef(activities)

  useEffect(() => {
    activitiesRef.current = activities
  }, [activities])

  const loadDayDetails = useCallback(
    async (dateKey: string) => {
      if (!groupId) {
        return
      }

      const day =
        activitiesRef.current[dateKey]

      const hasPartial = Object.values(
        day ?? {},
      ).some((list) =>
        list.some(
          (activity) => activity.partial,
        ),
      )

      if (!hasPartial) {
        return
      }

      const rows =
        await fetchDayDetails(
          groupId,
          dateKey,
        )

      if (!rows) {
        return
      }

      setActivities((current) =>
        rows.reduce(
          (next, row) =>
            upsertActivity(
              next,
              dateKey,
              row.userId,
              row.activity,
            ),
          current,
        ),
      )
    },
    [groupId],
  )

  return {
    loadDayDetails,
    users,
    setUsers,
    activities,
    setActivities,
    loading,
    error,
    setError,
    clear,
    removeMember,
  }
}
