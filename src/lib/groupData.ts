import {
  supabase,
} from './supabase'

import {
  addDays,
  formatDateKey,
} from '../utils/date'

import type {
  ActivitiesByDate,
  Activity,
  ActivityComment,
  ActivityReaction,
  ActivityType,
  Mood,
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
  mood?: string | null
  note?: string | null

  /*
   * Fila del historial viejo, traída sin
   * comentarios (ver fetchGroupActivities).
   */
  partial?: boolean
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

/*
 * ¿Cómo te sentiste? (mood + note). Si la
 * migración todavía no se corrió, la
 * primera consulta falla por esas columnas:
 * se marca como no disponible y se sigue
 * sin ellas.
 */
let moodSupported = true

export function isMoodSupported() {
  return moodSupported
}

function moodColumns() {
  return moodSupported
    ? `,
  mood,
  note`
    : ''
}

function isMissingMoodColumns(
  error: {
    code?: string
    message?: string
  } | null,
) {
  return Boolean(
    error &&
      (error.code === '42703' ||
        error.code === 'PGRST204') &&
      /mood|note/.test(
        error.message ?? '',
      ),
  )
}

/*
 * Corre la consulta; si falló por las
 * columnas de ánimo, la repite sin ellas.
 */
async function withMoodFallback<
  T extends {
    error: {
      code?: string
      message?: string
    } | null
  },
>(run: () => PromiseLike<T>): Promise<T> {
  const result = await run()

  if (
    moodSupported &&
    isMissingMoodColumns(result.error)
  ) {
    moodSupported = false

    return run()
  }

  return result
}

function socialColumns() {
  return `
  ${ACTIVITY_COLUMNS},
  photo_url${moodColumns()},

  comments:activity_comments (
    id,
    user_id,
    body,
    created_at
  )
`
}

/*
 * Sin comentarios, para el historial viejo:
 * es lo que más pesa y casi nunca se mira.
 */
function lightColumns() {
  return `
  ${ACTIVITY_COLUMNS},
  photo_url${moodColumns()}
`
}

/*
 * Los últimos ~4 meses se traen completos.
 * Lo anterior, sin comentarios: cuando se
 * abre un día viejo se completan
 * (fetchDayDetails).
 */
export const RECENT_DAYS = 120

/*
 * Supabase devuelve como mucho 1000 filas
 * por consulta: se pide de a páginas.
 */
const PAGE_SIZE = 1000

type PageResult = {
  data: unknown[] | null
  error: {
    code?: string
    message?: string
  } | null
}

async function fetchAllPages(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<PageResult>,
): Promise<PageResult> {
  const rows: unknown[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(
      from,
      from + PAGE_SIZE - 1,
    )

    if (error) {
      return {
        data: null,
        error,
      }
    }

    rows.push(...(data ?? []))

    if ((data?.length ?? 0) < PAGE_SIZE) {
      return {
        data: rows,
        error: null,
      }
    }
  }
}

type DateRange = {
  since?: string
  before?: string
}

function fetchActivities(
  groupId: string,
  columns: string,
  range: DateRange = {},
) {
  return fetchAllPages((from, to) => {
    let query = supabase
      .from('activities')
      .select(columns)
      .eq('group_id', groupId)

    if (range.since) {
      query = query.gte(
        'activity_date',
        range.since,
      )
    }

    if (range.before) {
      query = query.lt(
        'activity_date',
        range.before,
      )
    }

    return query
      .order('created_at', {
        ascending: true,
      })
      .order('id', {
        ascending: true,
      })
      .range(from, to)
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

export function getRecentCutoff(
  today = new Date(),
) {
  return formatDateKey(
    addDays(today, -RECENT_DAYS),
  )
}

/*
 * Todo el historial del grupo:
 * - reciente: completo (fotos, comentarios)
 * - viejo: sin comentarios (partial)
 *
 * Las rachas necesitan todos los días, por
 * eso no se puede cortar el historial.
 */
async function fetchGroupActivities(
  groupId: string,
): Promise<PageResult> {
  const cutoff = getRecentCutoff()

  const [recent, old] =
    await Promise.all([
      withMoodFallback(() =>
        fetchActivities(
          groupId,
          socialColumns(),
          {
            since: cutoff,
          },
        ),
      ),
      withMoodFallback(() =>
        fetchActivities(
          groupId,
          lightColumns(),
          {
            before: cutoff,
          },
        ),
      ),
    ])

  if (
    isMissingSocialSchema(recent.error) ||
    isMissingSocialSchema(old.error)
  ) {
    console.warn(
      'Fotos y comentarios no disponibles todavía (falta correr la migración). Cargando sin ellos.',
    )

    return fetchActivities(
      groupId,
      ACTIVITY_COLUMNS,
    )
  }

  if (recent.error || old.error) {
    return {
      data: null,
      error: recent.error ?? old.error,
    }
  }

  return {
    data: [
      ...(old.data ?? []).map((row) => ({
        ...(row as ActivityRow),
        partial: true,
      })),
      ...(recent.data ?? []),
    ],
    error: null,
  }
}

/*
 * Completa un día viejo (con comentarios)
 * cuando alguien lo abre.
 */
export async function fetchDayDetails(
  groupId: string,
  dateKey: string,
) {
  const { data, error } =
    await withMoodFallback(() =>
      supabase
        .from('activities')
        .select(socialColumns())
        .eq('group_id', groupId)
        .eq('activity_date', dateKey)
        .order('created_at', {
          ascending: true,
        }),
    )

  if (error) {
    return null
  }

  return (
    (data ?? []) as unknown as ActivityRow[]
  ).map((row) => ({
    userId: row.user_id,
    activity: mapActivityRow(row),
  }))
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

    fetchGroupActivities(groupId),
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

function mapActivityRow(
  row: ActivityRow,
): Activity {
  const reactions: ActivityReaction[] =
    (row.reactions ?? []).map(
      (reaction) => ({
        user_id: reaction.user_id,
        emoji:
          reaction.emoji as ReactionEmoji,
      }),
    )

  return {
    id: row.id,
    type: row.type as ActivityType,
    duration: row.duration,
    recovered_with_wildcard:
      row.recovered_with_wildcard,
    reactions,
    photo_url: row.photo_url ?? null,
    mood: (row.mood ?? null) as Mood | null,
    note: row.note ?? null,
    ...(row.partial
      ? {
          partial: true,
        }
      : {}),
    comments: [
      ...(row.comments ?? []),
    ].sort((a, b) =>
      a.created_at.localeCompare(
        b.created_at,
      ),
    ),
  }
}

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

    userActivities.push(
      mapActivityRow(row),
    )
  })

  return activityMap
}

/*
 * ========================================
 * UNA SOLA ACTIVIDAD
 * ========================================
 *
 * Para el refresco en tiempo real: en vez
 * de recargar todo el historial, se trae
 * solo la actividad que cambió.
 *
 * Devuelve:
 *   { status: 'found', ... }   -> existe
 *   { status: 'missing' }      -> se borró o no es de este grupo
 *   { status: 'error' }        -> falló la consulta
 */
export async function fetchActivityById(
  groupId: string,
  activityId: string,
) {
  const query = (columns: string) =>
    supabase
      .from('activities')
      .select(columns)
      .eq('id', activityId)
      .eq('group_id', groupId)
      .maybeSingle()

  let result = await withMoodFallback(
    () => query(socialColumns()),
  )

  if (isMissingSocialSchema(result.error)) {
    result = await query(ACTIVITY_COLUMNS)
  }

  if (result.error) {
    console.error(
      'Error refrescando actividad:',
      result.error,
    )

    return {
      status: 'error' as const,
    }
  }

  if (!result.data) {
    return {
      status: 'missing' as const,
    }
  }

  const row =
    result.data as unknown as ActivityRow

  return {
    status: 'found' as const,
    dateKey: row.activity_date,
    userId: row.user_id,
    activity: mapActivityRow(row),
  }
}
