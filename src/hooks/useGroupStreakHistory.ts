import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

export type GroupWeekMemberHistory = {
  id: string
  userId: string
  name: string
  weeklyGoal: number
  completedDays: number
  metGoal: boolean
  completedOn: string | null
}

export type GroupWeekHistory = {
  id: string
  weekStart: string

  status:
    | 'open'
    | 'saved'
    | 'failed'

  finalizedAt:
    string | null

  members:
    GroupWeekMemberHistory[]
}

type WeekRow = {
  id: string
  week_start: string

  status:
    | 'open'
    | 'saved'
    | 'failed'

  finalized_at:
    string | null
}

type MemberRow = {
  id: string
  week_id: string
  user_id: string
  member_name: string
  weekly_goal: number
  completed_days: number
  met_goal: boolean
  completed_on: string | null
}

export function useGroupStreakHistory(
  groupId: string | null,
) {
  const [
    weeks,
    setWeeks,
  ] =
    useState<
      GroupWeekHistory[]
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

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    )

  /*
   * ========================================
   * LEER HISTORIAL
   * ========================================
   */

  const refresh =
    useCallback(
      async () => {
        if (
          !groupId
        ) {
          setWeeks(
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

        setError(
          null,
        )

        const {
          data:
            weekData,
          error:
            weekError,
        } =
          await supabase
            .from(
              'group_week_history',
            )
            .select(
              `
              id,
              week_start,
              status,
              finalized_at
            `,
            )
            .eq(
              'group_id',
              groupId,
            )
            .order(
              'week_start',
              {
                ascending:
                  false,
              },
            )
            .limit(
              52,
            )

        if (
          weekError
        ) {
          console.error(
            'Error cargando historial grupal:',
            weekError,
          )

          setError(
            'No pudimos cargar el historial.',
          )

          setLoading(
            false,
          )

          return
        }

        const weekRows =
          (
            weekData ??
            []
          ) as WeekRow[]

        if (
          weekRows.length ===
          0
        ) {
          setWeeks(
            [],
          )

          setLoading(
            false,
          )

          return
        }

        const weekIds =
          weekRows.map(
            (
              week,
            ) =>
              week.id,
          )

        const {
          data:
            memberData,
          error:
            memberError,
        } =
          await supabase
            .from(
              'group_week_member_results',
            )
            .select(
              `
              id,
              week_id,
              user_id,
              member_name,
              weekly_goal,
              completed_days,
              met_goal,
              completed_on
            `,
            )
            .in(
              'week_id',
              weekIds,
            )

        if (
          memberError
        ) {
          console.error(
            'Error cargando resultados semanales:',
            memberError,
          )

          setError(
            'No pudimos cargar los resultados.',
          )

          setLoading(
            false,
          )

          return
        }

        const memberRows =
          (
            memberData ??
            []
          ) as MemberRow[]

        const mapped:
          GroupWeekHistory[] =
            weekRows.map(
              (
                week,
              ) => ({
                id:
                  week.id,

                weekStart:
                  week.week_start,

                status:
                  week.status,

                finalizedAt:
                  week.finalized_at,

                members:
                  memberRows
                    .filter(
                      (
                        member,
                      ) =>
                        member.week_id ===
                        week.id,
                    )
                    .map(
                      (
                        member,
                      ) => ({
                        id:
                          member.id,

                        userId:
                          member.user_id,

                        name:
                          member.member_name,

                        weeklyGoal:
                          member.weekly_goal,

                        completedDays:
                          member.completed_days,

                        metGoal:
                          member.met_goal,

                        completedOn:
                          member.completed_on,
                      }),
                    ),
              }),
            )

        setWeeks(
          mapped,
        )

        setLoading(
          false,
        )
      },
      [
        groupId,
      ],
    )

  /*
   * ========================================
   * PRIMERA SINCRONIZACIÓN
   * ========================================
   */

  useEffect(() => {
    if (
      !groupId
    ) {
      return
    }

    const load =
      async () => {
        const {
          error:
            syncError,
        } =
          await supabase.rpc(
            'sync_group_week_history',
            {
              p_group_id:
                groupId,
            },
          )

        if (
          syncError
        ) {
          console.error(
            'Error sincronizando historial:',
            syncError,
          )
        }

        await refresh()
      }

    void load()
  }, [
    groupId,
    refresh,
  ])

  /*
   * ========================================
   * REALTIME
   * ========================================
   */

  useEffect(() => {
    if (
      !groupId
    ) {
      return
    }

    const channel =
      supabase
        .channel(
          `group-history-${groupId}`,
        )

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'group_week_history',

            filter:
              `group_id=eq.${groupId}`,
          },
          () => {
            void refresh()
          },
        )

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'group_week_member_results',
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
    groupId,
    refresh,
  ])

  return {
    weeks,
    loading,
    error,
    refresh,
  }
}