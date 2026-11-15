import {
  supabase,
} from './supabase'

import type {
  ActivitiesByDate,
  ActivityReaction,
  ActivityType,
  ReactionEmoji,
  User,
} from '../types'

/*
 * ========================================
 * FILAS QUE DEVUELVE SUPABASE
 * ========================================
 */

type MemberRow = {
  user_id: string
  weekly_goal: number
  streak_eligible_from: string

  profile: {
    id: string
    name: string
    avatar_url: string | null
  } | null
}

type ReactionRow = {
  user_id: string
  emoji: string
}

type ActivityRow = {
  id: string
  user_id: string
  activity_date: string
  type: string
  duration: number
  recovered_with_wildcard: boolean
  reactions: ReactionRow[] | null
}

const avatarColors = [
  'bg-violet-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-orange-500',
]

const DEFAULT_WEEKLY_GOAL = 4

/*
 * Inicial del nombre para el avatar sin foto.
 */
export function getNameFallback(
  name: string,
) {
  return (
    name
      .trim()
      .charAt(0)
      .toUpperCase() || '?'
  )
}

/*
 * ========================================
 * CONSULTA
 * ========================================
 */

export function fetchGroupData(
  groupId: string,
) {
  return Promise.all([
    supabase
      .from('group_members')
      .select(`
        user_id,
        weekly_goal,
        streak_eligible_from,

        profile:profiles!group_members_user_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('group_id', groupId),

    supabase
      .from('activities')
      .select(`
        id,
        user_id,
        activity_date,
        type,
        duration,
        recovered_with_wildcard,

        reactions:activity_reactions (
          user_id,
          emoji
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', {
        ascending: true,
      }),
  ])
}

/*
 * ========================================
 * MIEMBROS -> USERS
 * ========================================
 *
 * El usuario actual va primero,
 * el resto por nombre.
 */

export function mapMembersToUsers(
  data: unknown[] | null,
  currentUserId: string,
): User[] {
  const memberRows =
    (data ?? []) as MemberRow[]

  return memberRows
    .filter((member) =>
      Boolean(member.profile),
    )
    .map((member, index): User => {
      const memberProfile =
        member.profile!

      return {
        id: memberProfile.id,
        name: memberProfile.name,
        avatar: memberProfile.avatar_url,
        fallback: getNameFallback(
          memberProfile.name,
        ),
        avatarColor:
          avatarColors[
            index % avatarColors.length
          ],
        weeklyGoal:
          member.weekly_goal ??
          DEFAULT_WEEKLY_GOAL,
        streakEligibleFrom:
          member.streak_eligible_from,
      }
    })
    .sort((a, b) => {
      if (a.id === currentUserId) {
        return -1
      }

      if (b.id === currentUserId) {
        return 1
      }

      return a.name.localeCompare(
        b.name,
      )
    })
}

/*
 * ========================================
 * ACTIVIDADES -> MAPA POR FECHA Y USUARIO
 * ========================================
 */

export function mapActivityRows(
  data: unknown[] | null,
): ActivitiesByDate {
  const activityRows =
    (data ?? []) as ActivityRow[]

  const activityMap: ActivitiesByDate =
    {}

  activityRows.forEach((row) => {
    const day =
      (activityMap[row.activity_date] ??=
        {})

    const userActivities =
      (day[row.user_id] ??= [])

    const reactions: ActivityReaction[] =
      (row.reactions ?? []).map(
        (reaction) => ({
          user_id: reaction.user_id,
          emoji:
            reaction.emoji as ReactionEmoji,
        }),
      )

    userActivities.push({
      id: row.id,
      type: row.type as ActivityType,
      duration: row.duration,
      recovered_with_wildcard:
        row.recovered_with_wildcard,
      reactions,
    })
  })

  return activityMap
}
