import {
  supabase,
} from './supabase'

import type {
  ActivitiesByDate,
  ActivityComment,
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

  /*
   * Pueden faltar si la base todavía
   * no tiene la migración de fotos
   * y comentarios.
   */
  photo_url?: string | null
  comments?: ActivityComment[] | null
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

const ACTIVITY_COLUMNS = `
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
`

const ACTIVITY_COLUMNS_WITH_SOCIAL = `
  ${ACTIVITY_COLUMNS},
  photo_url,

  comments:activity_comments (
    id,
    user_id,
    body,
    created_at
  )
`

function fetchActivities(
  groupId: string,
  columns: string,
) {
  return supabase
    .from('activities')
    .select(columns)
    .eq('group_id', groupId)
    .order('created_at', {
      ascending: true,
    })
}

/*
 * Si la base todavía no tiene la columna
 * photo_url o la tabla activity_comments
 * (migración sin correr), PostgREST
 * devuelve 42703 / PGRST200. En ese caso
 * cargamos sin fotos ni comentarios para
 * que la app siga andando.
 */
function isMissingSocialSchema(
  error: {
    code?: string
  } | null,
) {
  return (
    error?.code === '42703' ||
    error?.code === 'PGRST200'
  )
}

async function fetchActivitiesWithFallback(
  groupId: string,
) {
  const result = await fetchActivities(
    groupId,
    ACTIVITY_COLUMNS_WITH_SOCIAL,
  )

  if (!isMissingSocialSchema(result.error)) {
    return result
  }

  console.warn(
    'Fotos y comentarios no disponibles todavía (falta correr la migración). Cargando sin ellos.',
  )

  return fetchActivities(
    groupId,
    ACTIVITY_COLUMNS,
  )
}

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

    fetchActivitiesWithFallback(groupId),
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
      photo_url: row.photo_url ?? null,
      comments: [
        ...(row.comments ?? []),
      ].sort((a, b) =>
        a.created_at.localeCompare(
          b.created_at,
        ),
      ),
    })
  })

  return activityMap
}
