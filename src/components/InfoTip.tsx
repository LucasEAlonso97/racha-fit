import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Info,
} from 'lucide-react'

type Props = {
  /*
   * La explicación: se ve solo si la
   * persona toca la ⓘ.
   */
  text: string
  label?: string
}

/*
 * ========================================
 * ⓘ EXPLICACIÓN A PEDIDO
 * ========================================
 *
 * En vez de dejar las reglas siempre a la
 * vista, quedan detrás de este botoncito.
 * Se cierra tocando afuera.
 */
function InfoTip({
  text,
  label = 'Más info',
}: Props) {
  const [open, setOpen] =
    useState(false)

  const ref =
    useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const close = (
      event: PointerEvent,
    ) => {
      if (
        !ref.current?.contains(
          event.target as Node,
        )
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      close,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        close,
      )
    }
  }, [open])

  return (
    <span
      ref={ref}
      className="relative inline-flex align-middle"
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition active:scale-90"
      >
        <Info size={15} />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-7 z-40 w-60 -translate-x-1/2 rounded-2xl bg-zinc-900 px-3 py-2.5 text-left text-sm font-semibold normal-case leading-snug tracking-normal text-white shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  )
}

export default InfoTip
