import {
  supabase,
} from './supabase'

/*
 * ========================================
 * PANEL DE ADMIN Y SUGERENCIAS
 * ========================================
 *
 * Todo pasa por funciones de la base
 * (migración 20261126120000_panel_admin):
 * las tablas no se leen directo. Las admin_*
 * solo responden a quien está en
 * app_admins.
 *
 * Si la migración no se corrió, todo
 * devuelve null / false y la app sigue
 * igual.
 */

function isMissing(
  error: {
    code?: string
  } | null,
) {
  return (
    error?.code === 'PGRST202' ||
    error?.code === '42883' ||
    error?.code === '42P01'
  )
}

function logError(
  label: string,
  error: {
    code?: string
    message?: string
  } | null,
) {
  if (error && !isMissing(error)) {
    console.error(label, error)
  }
}

/*
 * ----------------------------------------
 * Uso diario: "abrí la app hoy"
 * ----------------------------------------
 *
 * Como mucho una vez cada 15 minutos por
 * celu (la base guarda la primera y la
 * última vez del día).
 */

const TOUCH_KEY = 'racha-usage-touch'
const TOUCH_EVERY_MS = 15 * 60 * 1000

export async function touchAppUsage(
  userId: string,
) {
  try {
    const raw =
      window.localStorage.getItem(
        TOUCH_KEY,
      )

    const last = raw
      ? (JSON.parse(raw) as {
          userId: string
          at: number
        })
      : null

    if (
      last &&
      last.userId === userId &&
      Date.now() - last.at <
        TOUCH_EVERY_MS
    ) {
      return
    }

    window.localStorage.setItem(
      TOUCH_KEY,
      JSON.stringify({
        userId,
        at: Date.now(),
      }),
    )
  } catch {
    // Sin storage: se registra igual.
  }

  if (!navigator.onLine) {
    return
  }

  const { error } = await supabase.rpc(
    'touch_app_usage',
  )

  logError(
    'Error registrando uso:',
    error,
  )
}

/*
 * ----------------------------------------
 * Sugerencias
 * ----------------------------------------
 */

export type FeedbackKind =
  | 'idea'
  | 'problem'

export const FEEDBACK_MAX_LENGTH = 1000

export async function submitFeedback(
  kind: FeedbackKind,
  message: string,
): Promise<string | null> {
  const { error } = await supabase.rpc(
    'submit_feedback',
    {
      p_kind: kind,
      p_message: message,
      p_app_version: __APP_VERSION__,
    },
  )

  if (!error) {
    return null
  }

  if (isMissing(error)) {
    return 'Todavía no se puede mandar sugerencias. Probá más tarde.'
  }

  if (error.message?.includes('TOO_MANY')) {
    return 'Ya mandaste varias hoy. ¡Gracias! Probá mañana.'
  }

  if (error.message?.includes('TOO_SHORT')) {
    return 'Escribí un poquito más.'
  }

  console.error(
    'Error mandando sugerencia:',
    error,
  )

  return 'No pudimos mandarla. Probá de nuevo.'
}

/*
 * ----------------------------------------
 * Panel
 * ----------------------------------------
 */

export async function isAppAdmin() {
  const { data, error } =
    await supabase.rpc('is_app_admin')

  logError(
    'Error viendo si es admin:',
    error,
  )

  return data === true
}

export type AdminOverview = {
  users_total: number
  signups_7d: number
  signups_30d: number
  opened_today: number
  opened_7d: number
  opened_30d: number
  trained_today: number
  trained_7d: number
  trained_30d: number
  activities_7d: number
  groups_total: number
  groups_active_7d: number
  usage_since: string | null
  feedback_unread: number
}

export type AdminDay = {
  day: string
  opened: number
  trained: number
  activities: number
  signups: number
}

export type AdminCohort = {
  cohort_week: string
  users: number
  week1: number
  week2: number
  week4: number
}

export type AdminUser = {
  user_id: string
  name: string | null
  avatar_url: string | null
  signed_up_at: string | null
  last_seen_at: string | null
  last_activity: string | null
  activities_30d: number
  groups: number
}

export type AdminFeedback = {
  id: string
  user_name: string
  kind: FeedbackKind
  message: string
  app_version: string | null
  created_at: string
  read_at: string | null
}

export type AdminData = {
  overview: AdminOverview
  daily: AdminDay[]
  retention: AdminCohort[]
  users: AdminUser[]
  feedback: AdminFeedback[]
}

export async function loadAdminData(): Promise<AdminData | null> {
  const [
    overview,
    daily,
    retention,
    users,
    feedback,
  ] = await Promise.all([
    supabase.rpc('admin_overview'),
    supabase.rpc('admin_daily', {
      p_days: 30,
    }),
    supabase.rpc('admin_retention'),
    supabase.rpc('admin_users'),
    supabase.rpc('admin_feedback', {
      p_limit: 100,
    }),
  ])

  const failed = [
    overview,
    daily,
    retention,
    users,
    feedback,
  ].find((result) => result.error)

  if (failed) {
    logError(
      'Error cargando el panel:',
      failed.error,
    )

    return null
  }

  return {
    overview:
      overview.data as AdminOverview,
    daily: (daily.data ??
      []) as AdminDay[],
    retention: (retention.data ??
      []) as AdminCohort[],
    users: (users.data ??
      []) as AdminUser[],
    feedback: (feedback.data ??
      []) as AdminFeedback[],
  }
}

export async function markFeedbackRead(
  id: string,
) {
  const { error } = await supabase.rpc(
    'admin_mark_feedback_read',
    {
      p_id: id,
    },
  )

  logError(
    'Error marcando sugerencia:',
    error,
  )

  return !error
}
