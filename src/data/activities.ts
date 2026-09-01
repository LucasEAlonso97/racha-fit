import type {
  ActivityType,
} from '../types'

export const activityOptions: {
  name: ActivityType
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

export function getActivityEmoji(
  type: ActivityType,
) {
  return (
    activityOptions.find(
      activity =>
        activity.name === type,
    )?.emoji ?? '✨'
  )
}