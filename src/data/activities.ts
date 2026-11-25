import type {
  ActivityType,
  BuiltInActivityType,
} from '../types'

export const activityOptions: {
  name: BuiltInActivityType
  emoji: string
}[] = [
  {
    name: 'Gym',
    emoji: '🏋️',
  },
  {
    name: 'Caminata',
    emoji: '🚶',
  },
  {
    name: 'Correr',
    emoji: '🏃',
  },
  {
    name: 'Bicicleta',
    emoji: '🚲',
  },
  {
    name: 'Calistenia',
    emoji: '🤸',
  },
  {
    name: 'Tenis',
    emoji: '🎾',
  },
  {
    name: 'Natación',
    emoji: '🏊',
  },
  {
    name: 'Funcional',
    emoji: '💪',
  },
  {
    name: 'Yoga',
    emoji: '🧘',
  },
  {
    name: 'Pilates',
    emoji: '🧘‍♀️',
  },
  {
    name: 'Fútbol',
    emoji: '⚽',
  },
  {
    name: 'Pádel',
    emoji: '🏓',
  },
  {
    name: 'Boxeo',
    emoji: '🥊',
  },
  {
    name: 'Baile',
    emoji: '💃',
  },
  {
    name: 'Escalada',
    emoji: '🧗',
  },
  {
    name: 'Vóley',
    emoji: '🏐',
  },
  {
    name: 'Básquet',
    emoji: '🏀',
  },
  {
    name: 'Handball',
    emoji: '🤾',
  },
  {
    name: 'Otra',
    emoji: '✨',
  },
]

/*
 * ========================================
 * DEPORTES PROPIOS
 * ========================================
 *
 * Emoji de cada deporte propio que la app
 * va viendo al cargar actividades.
 */
const customEmojis = new Map<
  string,
  string
>()

export const CUSTOM_SPORT_MAX_LENGTH = 30

/*
 * Emojis para elegir al crear un deporte.
 */
export const CUSTOM_SPORT_EMOJIS = [
  '⚡',
  '🔥',
  '🥋',
  '🏉',
  '⛳',
  '🏒',
  '🤺',
  '🏇',
  '🛹',
  '🏄',
  '⛷️',
  '🚣',
  '🧗',
  '🤼',
  '🏸',
  '🎯',
  '🪂',
  '🥾',
]

export function isBuiltInType(
  type: string,
): type is BuiltInActivityType {
  return activityOptions.some(
    (option) => option.name === type,
  )
}

export function registerCustomSport(
  name: string,
  emoji: string | null | undefined,
) {
  if (emoji && !isBuiltInType(name)) {
    customEmojis.set(name, emoji)
  }
}

export function getActivityEmoji(
  type: ActivityType | null | undefined,
) {
  if (!type) {
    return '✨'
  }

  return (
    activityOptions.find(
      (activity) =>
        activity.name === type,
    )?.emoji ??
    customEmojis.get(type) ??
    '✨'
  )
}
