import {
  useState,
  type ReactNode,
} from 'react'

import {
  X,
} from 'lucide-react'

/*
 * ========================================
 * HISTORIAS (MARCO COMÚN)
 * ========================================
 *
 * Pantalla completa tipo Instagram: barras
 * de progreso arriba, tocás a la derecha
 * para avanzar y a la izquierda para
 * volver. La usan el Wrapped del año y el
 * resumen de la semana.
 */

export type Slide = {
  id: string
  background: string
  content: ReactNode
}

type Props = {
  title: string
  label: string
  slides: Slide[]
  onClose: () => void
}

function StoriesShell({
  title,
  label,
  slides,
  onClose,
}: Props) {
  const [index, setIndex] =
    useState(0)

  const safeIndex = Math.min(
    index,
    slides.length - 1,
  )

  const slide = slides[safeIndex]

  const isLast =
    safeIndex === slides.length - 1

  const go = (delta: number) => {
    setIndex((current) =>
      Math.max(
        0,
        Math.min(
          slides.length - 1,
          current + delta,
        ),
      ),
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 z-[90] flex flex-col bg-gradient-to-br text-white transition-colors duration-500 ${slide.background}`}
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/10" />

      <div className="relative z-20 mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex gap-1">
          {slides.map((item, itemIndex) => (
            <div
              key={item.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={`h-full rounded-full bg-white transition-all duration-300 ${
                  itemIndex <= safeIndex
                    ? 'w-full'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-black text-white/90">
            {title}
          </p>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center"
        onClick={(event) => {
          const bounds =
            event.currentTarget.getBoundingClientRect()

          const x =
            event.clientX - bounds.left

          if (x < bounds.width / 3) {
            go(-1)
          } else if (!isLast) {
            go(1)
          }
        }}
      >
        <div
          key={slide.id}
          className="wrapped-pop mx-auto w-full max-w-md px-8 pb-[max(env(safe-area-inset-bottom),24px)] text-center"
        >
          {slide.content}
        </div>
      </div>
    </div>
  )
}

/*
 * Piezas de texto de las historias.
 */

export function Big({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="text-[96px] font-black leading-none tracking-tight drop-shadow-sm">
      {children}
    </p>
  )
}

export function Kicker({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">
      {children}
    </p>
  )
}

export function Line({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="mt-4 text-2xl font-black leading-tight">
      {children}
    </p>
  )
}

export function Note({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="mt-6 text-base font-semibold leading-relaxed text-white/85">
      {children}
    </p>
  )
}

export function SummaryBox({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="rounded-3xl bg-white/15 px-3 py-4">
      <p className="truncate text-3xl font-black">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-bold uppercase tracking-wider text-white/80">
        {label}
      </p>
    </div>
  )
}

export function ShareFooter({
  sharing,
  onShare,
  onClose,
}: {
  sharing: boolean
  onShare: () => void
  onClose: () => void
}) {
  return (
    <div className="relative z-10 mt-8 space-y-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onShare()
        }}
        disabled={sharing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-fuchsia-600 shadow-lg transition active:scale-[0.98] disabled:opacity-70"
      >
        {sharing ? '…' : '📲'} Compartir en
        historias
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        className="w-full py-2 text-sm font-bold text-white/80"
      >
        Cerrar
      </button>
    </div>
  )
}

export default StoriesShell
