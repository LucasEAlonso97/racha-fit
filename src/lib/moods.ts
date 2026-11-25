import type {
  Mood,
} from '../types'

/*
 * ¿Cómo te sentiste? Mismo orden que en la
 * base (activities.mood).
 */
export const MOODS: {
  id: Mood
  emoji: string
  label: string
}[] = [
  {
    id: 'tired',
    emoji: '😫',
    label: 'Me costó',
  },
  {
    id: 'ok',
    emoji: '😐',
    label: 'Normal',
  },
  {
    id: 'strong',
    emoji: '💪',
    label: 'Bien',
  },
  {
    id: 'fire',
    emoji: '🔥',
    label: 'Volé',
  },
]

export const NOTE_MAX_LENGTH = 140

export function getMood(
  mood: Mood | null | undefined,
) {
  return (
    MOODS.find(
      (item) => item.id === mood,
    ) ?? null
  )
}
