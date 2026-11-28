import {
  ChevronDown,
} from 'lucide-react'

type Props = {
  expanded: boolean
  hiddenCount: number

  /*
   * "semanas", "torneos"...
   */
  noun: string
  onToggle: () => void
}

/*
 * ========================================
 * "VER N MÁS" / "VER MENOS"
 * ========================================
 *
 * Para listas largas que arrancan
 * achicadas.
 */

function ShowMoreButton({
  expanded,
  hiddenCount,
  noun,
  onToggle,
}: Props) {
  if (!expanded && hiddenCount <= 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-zinc-50 py-3 text-xs font-bold text-violet-600 transition hover:bg-violet-50 active:scale-[0.99]"
    >
      {expanded
        ? 'Ver menos'
        : `Ver ${hiddenCount} ${noun} más`}

      <ChevronDown
        size={16}
        className={`transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
}

export default ShowMoreButton
