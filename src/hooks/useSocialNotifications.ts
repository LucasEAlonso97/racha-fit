import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

export type SocialNotification = {
  id: string

  type:
    | 'reaction'
    | 'nudge'

  actorUserId:
    string

  actorName:
    string

  actorAvatar:
    string | null

  activityId:
    string | null

  activityType:
    string | null

  activityDuration:
    number | null

  activityDate:
    string | null

  emoji:
    string | null

  notificationDate:
    string | null

  isRead:
    boolean

  createdAt:
    string
}

type Props = {
  userId:
    string

  groupId:
    string
}

type NotificationRow = {
  id: string

  type:
    | 'reaction'
    | 'nudge'

  actor_user_id:
    string

  activity_id:
    string | null

  emoji:
    string | null

  notification_date:
    string | null

  is_read:
    boolean

  created_at:
    string

  actor:
    | {
        id: string
        name: string
        avatar_url: string | null
      }
    | {
        id: string
        name: string
        avatar_url: string | null
      }[]
    | null

  activity:
    | {
        id: string
        type: string
        duration: number
        activity_date: string
      }
    | {
        id: string
        type: string
        duration: number
        activity_date: string
      }[]
    | null
}

function firstOrNull<T>(
  value:
    T |
    T[] |
    null,
): T | null {
  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value[
        0
      ] ??
      null
    )
  }

  return value
}

export function useSocialNotifications({
  userId,
  groupId,
}: Props) {
  const [
    notifications,
    setNotifications,
  ] =
    useState<
      SocialNotification[]
    >(
      [],
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    )

  /*
   * ========================================
   * CARGAR
   * ========================================
   */

  const refresh =
    useCallback(
      async () => {
        if (
          !userId ||
          !groupId
        ) {
          setNotifications(
            [],
          )

          setLoading(
            false,
          )

          return
        }

        setLoading(
          true,
        )

        const {
          data,
          error,
        } =
          await supabase
            .from(
              'social_notifications',
            )
            .select(
              `
              id,
              type,
              actor_user_id,
              activity_id,
              emoji,
              notification_date,
              is_read,
              created_at,

              actor:profiles!social_notifications_actor_user_id_fkey (
                id,
                name,
                avatar_url
              ),

              activity:activities!social_notifications_activity_id_fkey (
                id,
                type,
                duration,
                activity_date
              )
            `,
            )
            .eq(
              'recipient_user_id',
              userId,
            )
            .eq(
              'group_id',
              groupId,
            )
            .order(
              'created_at',
              {
                ascending:
                  false,
              },
            )
            .limit(
              20,
            )

        setLoading(
          false,
        )

        if (
          error
        ) {
          console.error(
            'Error cargando novedades:',
            error,
          )

          return
        }

        const rows =
          (
            data ??
            []
          ) as unknown as
            NotificationRow[]

        const mapped =
          rows.map(
            row => {
              const actor =
                firstOrNull(
                  row.actor,
                )

              const activity =
                firstOrNull(
                  row.activity,
                )

              return {
                id:
                  row.id,

                type:
                  row.type,

                actorUserId:
                  row.actor_user_id,

                actorName:
                  actor?.name ??
                  'Alguien',

                actorAvatar:
                  actor?.avatar_url ??
                  null,

                activityId:
                  activity?.id ??
                  null,

                activityType:
                  activity?.type ??
                  null,

                activityDuration:
                  activity?.duration ??
                  null,

                activityDate:
                  activity?.activity_date ??
                  null,

                emoji:
                  row.emoji,

                notificationDate:
                  row.notification_date,

                isRead:
                  row.is_read,

                createdAt:
                  row.created_at,
              }
            },
          )

        setNotifications(
          mapped,
        )
      },
      [
        userId,
        groupId,
      ],
    )

  /*
   * ========================================
   * PRIMERA CARGA
   * ========================================
   */

  useEffect(() => {
    void refresh()
  }, [
    refresh,
  ])

  /*
   * ========================================
   * REALTIME
   * ========================================
   */

  useEffect(() => {
    if (
      !userId
    ) {
      return
    }

    const channel =
      supabase
        .channel(
          `social-notifications-${userId}`,
        )

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'social_notifications',

            filter:
              `recipient_user_id=eq.${userId}`,
          },
          () => {
            void refresh()
          },
        )

        .subscribe()

    return () => {
      void supabase.removeChannel(
        channel,
      )
    }
  }, [
    userId,
    refresh,
  ])

  /*
   * ========================================
   * NO LEÍDAS
   * ========================================
   */

  const unreadCount =
    notifications.filter(
      notification =>
        !notification.isRead,
    ).length

  /*
   * ========================================
   * MARCAR COMO LEÍDAS
   * ========================================
   */

  const markAllRead =
    async () => {
      setNotifications(
        current =>
          current.map(
            notification => ({
              ...notification,
              isRead:
                true,
            }),
          ),
      )

      const {
        error,
      } =
        await supabase.rpc(
          'mark_my_social_notifications_read',
          {
            p_group_id:
              groupId,
          },
        )

      if (
        error
      ) {
        console.error(
          'Error marcando novedades como vistas:',
          error,
        )

        void refresh()
      }
    }

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAllRead,
  }
}