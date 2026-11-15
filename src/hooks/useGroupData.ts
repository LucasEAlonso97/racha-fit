import {
  useEffect,
  useState,
} from 'react'

import {
  removeUserActivities,
} from '../lib/activityState'

import {
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

  const [refreshKey, setRefreshKey] =
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
        refreshGroup,
      )

      /*
       * MIEMBROS
       *
       * Esto también hace que un cambio
       * de weekly_goal se refresque
       * automáticamente.
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
        refreshGroup,
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
        refreshGroup,
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
