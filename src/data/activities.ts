import type { ActivityType } from '../types'

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
    name: 'Otra',
    emoji: '✨',
  },
]

export function getActivityEmoji(
  type: ActivityType,
) {
  return (
    activityOptions.find(
      (activity) =>
        activity.name === type,
    )?.emoji ?? '✨'
  )
}