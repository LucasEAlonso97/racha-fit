import {
  useState,
} from 'react'

import {
  X,
} from 'lucide-react'

type Props = {
  url: string
  alt: string
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
}: Props) {
  const [expanded, setExpanded] =
    useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-3 block w-full overflow-hidden rounded-2xl"
      >
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="max-h-64 w-full object-cover"
        />
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-4"
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
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        </div>
      )}
    </>
  )
}

export default ActivityPhoto
