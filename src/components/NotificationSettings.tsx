import {
  useEffect,
  useState,
} from 'react'

import {
  Bell,
  BellRing,
  LoaderCircle,
  Smartphone,
} from 'lucide-react'

import {
  enablePushNotifications,
  getCurrentDevicePushStatus,
  supportsPushNotifications,
} from '../lib/pushNotifications'

type Props = {
  userId: string
}

function NotificationSettings({
  userId,
}: Props) {
  const [
    enabled,
    setEnabled,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    activating,
    setActivating,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const supported =
    supportsPushNotifications()

  useEffect(() => {
    let cancelled = false

    const checkDevice =
      async () => {
        setLoading(true)

        try {
          const deviceEnabled =
            await getCurrentDevicePushStatus(
              userId,
            )

          if (!cancelled) {
            setEnabled(
              deviceEnabled,
            )
          }
        } catch (caughtError) {
          console.error(
            'Error verificando notificaciones:',
            caughtError,
          )

          if (!cancelled) {
            setEnabled(false)
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

    void checkDevice()

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleEnable =
    async () => {
      setActivating(true)
      setError(null)

      try {
        await enablePushNotifications(
          userId,
        )

        const deviceEnabled =
          await getCurrentDevicePushStatus(
            userId,
          )

        setEnabled(
          deviceEnabled,
        )

        if (!deviceEnabled) {
          setError(
            'La suscripción se creó, pero no pudimos verificar este dispositivo.',
          )
        }
      } catch (caughtError) {
        console.error(
          'Error activando push:',
          caughtError,
        )

        setEnabled(false)

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : 'No pudimos activar las notificaciones.',
        )
      } finally {
        setActivating(false)
      }
    }

  if (loading) {
    return (
      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <LoaderCircle
            size={20}
            className="animate-spin text-violet-500"
          />

          <p className="text-sm font-bold text-zinc-400">
            Verificando notificaciones...
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            enabled
              ? 'bg-violet-100 text-violet-600'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {enabled ? (
            <BellRing size={22} />
          ) : (
            <Bell size={22} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-black text-zinc-800">
            Notificaciones
          </p>

          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Dos recordatorios
            inteligentes por día
            para mantener tu Racha.
          </p>
        </div>
      </div>

      {enabled ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Smartphone
              size={17}
              className="text-emerald-600"
            />

            <p className="text-sm font-black text-emerald-600">
              Activadas en este dispositivo
            </p>
          </div>

          <p className="mt-2 text-xs font-semibold text-emerald-500">
            🔔 13:00 · 20:30
          </p>

          <p className="mt-1 text-xs text-emerald-500">
            Podés recibirlas incluso
            con Racha cerrada.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={
            handleEnable
          }
          disabled={
            activating ||
            !supported
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-3.5 font-black text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {activating ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />

              Activando...
            </>
          ) : (
            <>
              <Bell size={18} />

              Activar en este dispositivo
            </>
          )}
        </button>
      )}

      {!supported && (
        <p className="mt-3 text-xs font-semibold leading-relaxed text-orange-500">
          Este dispositivo o navegador
          todavía no permite activar las
          notificaciones de Racha.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3">
          <p className="text-xs font-bold leading-relaxed text-red-500">
            {error}
          </p>
        </div>
      )}
    </section>
  )
}

export default NotificationSettings