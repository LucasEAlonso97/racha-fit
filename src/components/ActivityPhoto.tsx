import {
  useState,
} from 'react'

import {
  X,
} from 'lucide-react'

type Props = {
  url: string
  alt: string

  /*
   * 'wide': foto ancha dentro de una tarjeta.
   * 'square': miniatura cuadrada para grillas.
   */
  variant?: 'wide' | 'square'

  /*
   * Texto opcional debajo de la foto
   * ampliada (quién, qué, cuándo).
   */
  caption?: string
}

/*
 * ========================================
 * FOTO DE ACTIVIDAD
 * ========================================
 *
 * Miniatura que se abre en pantalla
 * completa al tocarla.
 */

function ActivityPhoto({
  url,
  alt,
  variant = 'wide',
  caption,
}: Props) {
  const [expanded, setExpanded] =
    useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={
          variant === 'square'
            ? 'block aspect-square w-full overflow-hidden rounded-xl bg-zinc-100'
            : 'mt-3 block w-full overflow-hidden rounded-2xl'
        }
      >
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className={
            variant === 'square'
              ? 'h-full w-full object-cover'
              : 'max-h-64 w-full object-cover'
          }
        />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-3 bg-black/90 p-4"
          onClick={() =>
            setExpanded(false)
          }
        >
          <button
            type="button"
            aria-label="Cerrar foto"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X size={22} />
          </button>

          <img
            src={url}
            alt={alt}
            className="max-h-[85%] max-w-full rounded-2xl object-contain"
          />

          {caption && (
            <p className="text-center text-sm font-bold text-white/80">
              {caption}
            </p>
          )}
        </div>
      )}
    </>
  )
}

export default ActivityPhoto
