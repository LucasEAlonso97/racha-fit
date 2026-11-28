import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'
import {
  useState,
  useSyncExternalStore,
} from 'react'

import type {
  ReactNode,
} from 'react'

import {
  Share,
  SquarePlus,
  X,
} from 'lucide-react'

import {
  canPromptInstall,
  dismissInstall,
  isIos,
  isRunningInstalled,
  promptInstall,
  subscribeInstall,
  wasInstallDismissed,
} from '../lib/installPrompt'

/*
 * ========================================
 * CARTEL "INSTALÁ RACHA"
 * ========================================
 *
 * Android: botón que abre el cartel
 * nativo de instalación.
 * iPhone: explica los 3 pasos de Safari.
 * No aparece si ya está instalada o si
 * la cerraron hace menos de 14 días.
 */

function InstallBanner() {
  const canPrompt =
    useSyncExternalStore(
      subscribeInstall,
      canPromptInstall,
    )

  const installedNow =
    useSyncExternalStore(
      subscribeInstall,
      isRunningInstalled,
    )

  const [hidden, setHidden] = useState(
    wasInstallDismissed,
  )

  const [showIosSteps, setShowIosSteps] =
    useState(false)

  const sheetRef =
    useSwipeToClose(() => setShowIosSteps(false))

  const ios = isIos()

  if (
    hidden ||
    installedNow ||
    (!canPrompt && !ios)
  ) {
    return null
  }

  const close = () => {
    dismissInstall()
    setHidden(true)
  }

  const install = async () => {
    if (ios) {
      setShowIosSteps(true)

      return
    }

    const accepted =
      await promptInstall()

    if (accepted) {
      setHidden(true)
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-md px-5 pt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-3 text-white shadow-sm">
          <img
            src="/racha-192.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl"
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">
              Instalá Racha
            </p>

            <p className="text-xs font-semibold opacity-90">
              Abrila desde tu pantalla
              de inicio, como cualquier
              app.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void install()}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-violet-600 transition active:scale-95"
          >
            Instalar
          </button>

          <button
            type="button"
            aria-label="Ahora no"
            onClick={close}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showIosSteps && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={() =>
            setShowIosSteps(false)
          }
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="w-full max-w-md rounded-t-[32px] bg-white px-6 pb-10 pt-7"
          >
            <h2 className="text-2xl font-black text-zinc-800">
              Instalar en iPhone
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Tiene que ser desde
              Safari.
            </p>

            <ol className="mt-6 space-y-4">
              <IosStep number={1}>
                Tocá{' '}
                <Share
                  size={18}
                  className="inline -translate-y-0.5 text-blue-500"
                />{' '}
                <b>Compartir</b> (abajo
                en la barra de Safari)
              </IosStep>

              <IosStep number={2}>
                Bajá y elegí{' '}
                <SquarePlus
                  size={18}
                  className="inline -translate-y-0.5"
                />{' '}
                <b>Agregar a inicio</b>
              </IosStep>

              <IosStep number={3}>
                Tocá <b>Agregar</b>, arriba
                a la derecha. ¡Listo! 🔥
              </IosStep>
            </ol>

            <button
              type="button"
              onClick={() => {
                setShowIosSteps(false)
                close()
              }}
              className="mt-8 w-full rounded-2xl bg-violet-500 py-4 font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function IosStep({
  number,
  children,
}: {
  number: number
  children: ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
        {number}
      </span>

      <p className="pt-1 text-zinc-700">
        {children}
      </p>
    </li>
  )
}

export default InstallBanner
