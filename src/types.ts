export type ActivityType =
  | 'Gym'
  | 'Caminata'
  | 'Correr'
  | 'Bicicleta'
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

export type Activity = {
  id?: string
  type: ActivityType
  duration: number
  reactions?: ActivityReaction[]
  recovered_with_wildcard?: boolean
}

export type User = {
  id: string
  name: string
  avatar: string | null
  fallback: string
  avatarColor: string
}

export type ActivitiesByDate = Record<
  string,
  Record<string, Activity[]>
>

export type View =
  | 'home'
  | 'calendar'
  | 'rachas'
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