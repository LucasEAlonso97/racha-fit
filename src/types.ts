export type ActivityType =
  | 'Gym'
  | 'Caminata'
  | 'Correr'
  | 'Bicicleta'
  | 'Calistenia'
  | 'Tenis'
  | 'Natación'
  | 'Funcional'
  | 'Yoga'
  | 'Pilates'
  | 'Fútbol'
  | 'Pádel'
  | 'Boxeo'
  | 'Baile'
  | 'Escalada'
  | 'Vóley'
  | 'Básquet'
  | 'Handball'
  | 'Otra'

export type ReactionEmoji =
  | '🔥'
  | '💪'
  | '👏'
  | '😂'
  | '❤️'

export type ActivityReaction = {
  user_id: string
  emoji: ReactionEmoji
}

export type ActivityComment = {
  id: string
  user_id: string
  body: string
  created_at: string
}

export type Activity = {
  id?: string
  type: ActivityType
  duration: number
  reactions?: ActivityReaction[]
  recovered_with_wildcard?: boolean
  photo_url?: string | null
  comments?: ActivityComment[]

  /*
   * Guardada sin señal: todavía no se
   * envió (ver lib/offlineQueue.ts).
   */
  pending?: boolean
}

/*
 * Qué hacer con la foto al guardar
 * una actividad.
 */
export type PhotoChange =
  | { kind: 'keep' }
  | { kind: 'remove' }
  | { kind: 'replace'; file: File }

export type User = {
  id: string
  name: string
  avatar: string | null
  fallback: string
  avatarColor: string

  weeklyGoal: number

  streakEligibleFrom:
    string | null
}

export type ActivitiesByDate = Record<
  string,
  Record<string, Activity[]>
>

export type View =
  | 'home'
  | 'calendar'
  | 'rachas'
  | 'tournaments'
  | 'profile'

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  onboarding_completed: boolean
}

export type Group = {
  id: string
  name: string
  invite_code: string
  created_by: string
}