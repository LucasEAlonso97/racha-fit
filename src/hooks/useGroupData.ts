import {
  useEffect,
  useState,
} from 'react'

import {
  removeActivityById,
  removeUserActivities,
  upsertActivity,
} from '../lib/activityState'

import {
  fetchActivityById,
  fetchGroupData,
  mapActivityRows,
  mapMembersToUsers,
} from '../lib/groupData'

import {
  supabase,
} from '../lib/supabase'

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

      const [
        membersResult,
        activitiesResult,
      ] =
        await fetchGroupData(groupId)

      if (cancelled) {
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
        mapActivityRows(
          activitiesResult.data,
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

  return {
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
