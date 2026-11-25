import {
  useEffect,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  LoaderCircle,
  X,
} from 'lucide-react'

import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'

type Props = {
  link: string
  groupName: string
  inviteCode: string
  onClose: () => void
}

/*
 * ========================================
 * INVITAR CON QR
 * ========================================
 *
 * Para cuando están juntos: tu amigo
 * escanea con la cámara y entra directo al
 * grupo (el link lleva tu ref, así que el
 * comodín por invitar también vale).
 *
 * La librería del QR se baja recién al
 * abrir esta ventana.
 */
function InviteQrModal({
  link,
  groupName,
  inviteCode,
  onClose,
}: Props) {
  const sheetRef =
    useSwipeToClose(onClose)

  const [qr, setQr] = useState<
    string | null
  >(null)

  const [failed, setFailed] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    void import('qrcode')
      .then((module) =>
        module.toDataURL(link, {
          width: 640,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#4c1d95',
            light: '#ffffff',
          },
        }),
      )
      .then((dataUrl) => {
        if (!cancelled) {
          setQr(dataUrl)
        }
      })
      .catch((error: unknown) => {
        console.error(
          'Error armando el QR:',
          error,
        )

        if (!cancelled) {
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [link])

  /*
   * Fuera de la ventana del grupo, así al
   * deslizar para cerrar no arrastra las
   * dos.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Invitar con QR"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="w-full max-w-md rounded-t-[32px] bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 text-center sm:rounded-[32px]"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs font-black tracking-wider text-violet-500">
          INVITAR CON QR
        </p>

        <h2 className="mt-1 text-2xl font-black text-zinc-800">
          {groupName}
        </h2>

        <p className="mt-1 text-sm font-semibold text-zinc-500">
          Que lo escanee con la cámara del
          celu y entra directo al grupo.
        </p>

        <div className="mx-auto mt-5 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-[28px] bg-white p-3 shadow-[0_0_0_6px_rgb(237_233_254)]">
          {qr ? (
            <img
              src={qr}
              alt={`Código QR para unirse a ${groupName}`}
              className="h-full w-full rounded-2xl [image-rendering:pixelated]"
            />
          ) : failed ? (
            <p className="px-6 text-sm font-semibold text-zinc-500">
              No pudimos armar el QR. Usá
              el botón de compartir.
            </p>
          ) : (
            <LoaderCircle
              size={28}
              className="animate-spin text-violet-400"
            />
          )}
        </div>

        <p className="mt-5 text-xs font-bold text-zinc-400">
          O con el código
        </p>

        <p className="mt-1 text-2xl font-black tracking-[0.2em] text-violet-700">
          {inviteCode}
        </p>

        <p className="mt-4 text-[11px] font-semibold text-zinc-400">
          🃏 Si es nuevo en Racha y registra
          su primera actividad, ganás un
          comodín.
        </p>
      </div>
    </div>,
    document.body,
  )
}

export default InviteQrModal
