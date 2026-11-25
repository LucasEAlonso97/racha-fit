import type {
  Mood,
} from '../types'

import {
  getMood,
} from '../lib/moods'

type Props = {
  mood?: Mood | null
  note?: string | null
}

/*
 * "¿Cómo te sentiste?" de una actividad:
 * el emoji y la nota, si hay.
 */
function ActivityMoodNote({
  mood,
  note,
}: Props) {
  const moodInfo = getMood(mood)

  if (!moodInfo && !note) {
    return null
  }

  return (
    <div className="mt-1.5 flex items-start gap-1.5">
      {moodInfo && (
        <span
          title={moodInfo.label}
          className="flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-black text-violet-600"
        >
          <span className="text-sm leading-none">
            {moodInfo.emoji}
          </span>
          {moodInfo.label}
        </span>
      )}

      {note && (
        <p className="min-w-0 break-words pt-0.5 text-[13px] font-medium italic leading-snug text-zinc-600">
          “{note}”
        </p>
      )}
    </div>
  )
}

export default ActivityMoodNote
