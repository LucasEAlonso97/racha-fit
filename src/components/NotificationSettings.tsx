import {
  useEffect,
  useState,
} from 'react'

import {
  Bell,
  BellRing,
  Check,
  Clock3,
  LoaderCircle,
  Save,
  Smartphone,
} from 'lucide-react'

import {
  supabase,
} from '../lib/supabase'

import {
  enablePushNotifications,
  getCurrentDevicePushStatus,
  supportsPushNotifications,
} from '../lib/pushNotifications'

type Props = {
  userId: string
}

const DEFAULT_TIME_1 =
  '13:00'

const DEFAULT_TIME_2 =
  '20:30'

function normalizeTime(
  value:
    string | null,
  fallback:
    string,
) {
  if (
    !value
  ) {
    return fallback
  }

  return value.slice(
    0,
    5,
  )
}

function NotificationSettings({
  userId,
}: Props) {
  /*
   * ========================================
   * PUSH
   * ========================================
   */

  const [
    enabled,
    setEnabled,
  ] =
    useState(
      false,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    )

  const [
    activating,
    setActivating,
  ] =
    useState(
      false,
    )

  /*
   * ========================================
   * HORARIOS
   * ========================================
   */

  const [
    time1,
    setTime1,
  ] =
    useState(
      DEFAULT_TIME_1,
    )

  const [
    time2,
    setTime2,
  ] =
    useState(
      DEFAULT_TIME_2,
    )

  const [
    savedTime1,
    setSavedTime1,
  ] =
    useState(
      DEFAULT_TIME_1,
    )

  const [
    savedTime2,
    setSavedTime2,
  ] =
    useState(
      DEFAULT_TIME_2,
    )

  const [
    savingTimes,
    setSavingTimes,
  ] =
    useState(
      false,
    )

  const [
    timesSaved,
    setTimesSaved,
  ] =
    useState(
      false,
    )

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    )

  const supported =
    supportsPushNotifications()

  /*
   * ========================================
   * CARGAR CONFIGURACIÓN
   * ========================================
   */

  useEffect(() => {
    let cancelled =
      false

    const load =
      async () => {
        setLoading(
          true,
        )

        setError(
          null,
        )

        try {
          const deviceEnabled =
            await getCurrentDevicePushStatus(
              userId,
            )

          const {
            data,
            error:
              preferencesError,
          } =
            await supabase
              .from(
                'notification_preferences',
              )
              .select(
                `
                first_notification_time,
                second_notification_time,
                timezone
              `,
              )
              .eq(
                'user_id',
                userId,
              )
              .maybeSingle()

          if (
            preferencesError
          ) {
            throw preferencesError
          }

          const loadedTime1 =
            normalizeTime(
              data?.first_notification_time ??
                null,
              DEFAULT_TIME_1,
            )

          const loadedTime2 =
            normalizeTime(
              data?.second_notification_time ??
                null,
              DEFAULT_TIME_2,
            )

          if (
            cancelled
          ) {
            return
          }

          setEnabled(
            deviceEnabled,
          )

          setTime1(
            loadedTime1,
          )

          setTime2(
            loadedTime2,
          )

          setSavedTime1(
            loadedTime1,
          )

          setSavedTime2(
            loadedTime2,
          )
        } catch (
          caughtError
        ) {
          console.error(
            'Error cargando configuración de notificaciones:',
            caughtError,
          )

          if (
            !cancelled
          ) {
            setError(
              'No pudimos cargar la configuración de notificaciones.',
            )
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false,
            )
          }
        }
      }

    void load()

    return () => {
      cancelled =
        true
    }
  }, [
    userId,
  ])

  /*
   * ========================================
   * ACTIVAR PUSH
   * ========================================
   */

  const handleEnable =
    async () => {
      setActivating(
        true,
      )

      setError(
        null,
      )

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

        if (
          !deviceEnabled
        ) {
          setError(
            'La suscripción se creó, pero no pudimos verificar este dispositivo.',
          )
        }
      } catch (
        caughtError
      ) {
        console.error(
          'Error activando push:',
          caughtError,
        )

        setEnabled(
          false,
        )

        setError(
          caughtError instanceof
            Error
            ? caughtError.message
            : 'No pudimos activar las notificaciones.',
        )
      } finally {
        setActivating(
          false,
        )
      }
    }

  /*
   * ========================================
   * GUARDAR HORARIOS
   * ========================================
   */

  const saveTimes =
    async () => {
      setError(
        null,
      )

      setTimesSaved(
        false,
      )

      if (
        !time1 ||
        !time2
      ) {
        setError(
          'Elegí los dos horarios.',
        )

        return
      }

      if (
        time1 ===
        time2
      ) {
        setError(
          'Los dos recordatorios tienen que tener horarios distintos.',
        )

        return
      }

      setSavingTimes(
        true,
      )

      const timezone =
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        'America/Argentina/Buenos_Aires'

      const {
        error:
          saveError,
      } =
        await supabase
          .from(
            'notification_preferences',
          )
          .upsert(
            {
              user_id:
                userId,

              first_notification_time:
                time1,

              second_notification_time:
                time2,

              timezone,

              updated_at:
                new Date()
                  .toISOString(),
            },
            {
              onConflict:
                'user_id',
            },
          )

      setSavingTimes(
        false,
      )

      if (
        saveError
      ) {
        console.error(
          'Error guardando horarios:',
          saveError,
        )

        setError(
          'No pudimos guardar tus horarios.',
        )

        return
      }

      setSavedTime1(
        time1,
      )

      setSavedTime2(
        time2,
      )

      setTimesSaved(
        true,
      )

      window.setTimeout(
        () => {
          setTimesSaved(
            false,
          )
        },
        2500,
      )
    }

  /*
   * ========================================
   * ¿CAMBIÓ?
   * ========================================
   */

  const timesChanged =
    time1 !==
      savedTime1 ||
    time2 !==
      savedTime2

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (
    loading
  ) {
    return (
      <section className="rounded-[24px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <LoaderCircle
            size={
              20
            }
            className="animate-spin text-violet-500"
          />

          <p className="text-sm font-bold text-zinc-400">
            Verificando
            notificaciones...
          </p>
        </div>
      </section>
    )
  }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <section className="rounded-[24px] bg-white p-5 shadow-sm">
      {/* HEADER */}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            enabled
              ? 'bg-violet-100 text-violet-600'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {enabled ? (
            <BellRing
              size={
                22
              }
            />
          ) : (
            <Bell
              size={
                22
              }
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-black text-zinc-800">
            Notificaciones
          </p>

          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Elegí cuándo querés que
            Racha te recuerde
            moverte.
          </p>
        </div>
      </div>

      {/* ESTADO */}

      {enabled ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Smartphone
              size={
                17
              }
              className="text-emerald-600"
            />

            <p className="text-sm font-black text-emerald-600">
              Activadas en este
              dispositivo
            </p>
          </div>

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
                size={
                  18
                }
                className="animate-spin"
              />

              Activando...
            </>
          ) : (
            <>
              <Bell
                size={
                  18
                }
              />

              Activar en este
              dispositivo
            </>
          )}
        </button>
      )}

      {/* ================================= */}
      {/* HORARIOS */}
      {/* ================================= */}

      <div className="mt-5 border-t border-zinc-100 pt-5">
        <div className="flex items-center gap-2">
          <Clock3
            size={
              18
            }
            className="text-violet-500"
          />

          <p className="text-xs font-black tracking-wider text-zinc-500">
            TUS HORARIOS
          </p>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          Dos momentos del día en los
          que Racha puede aparecer para
          darte un empujoncito.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* RECORDATORIO 1 */}

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-zinc-500">
              Recordatorio 1
            </span>

            <input
              type="time"
              value={
                time1
              }
              onChange={(
                event,
              ) => {
                setTime1(
                  event.target.value,
                )

                setTimesSaved(
                  false,
                )
              }}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-base font-black text-zinc-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          {/* RECORDATORIO 2 */}

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-zinc-500">
              Recordatorio 2
            </span>

            <input
              type="time"
              value={
                time2
              }
              onChange={(
                event,
              ) => {
                setTime2(
                  event.target.value,
                )

                setTimesSaved(
                  false,
                )
              }}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-center text-base font-black text-zinc-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </div>

        <div className="mt-3 rounded-2xl bg-violet-50 px-4 py-3">
          <p className="text-xs font-semibold leading-relaxed text-violet-600">
            🔔 {time1} · {time2}
          </p>

          <p className="mt-1 text-[11px] font-semibold leading-relaxed text-violet-400">
            Usamos la zona horaria de
            tu dispositivo.
          </p>
        </div>

        {/* GUARDAR */}

        {timesChanged ? (
          <button
            type="button"
            onClick={() =>
              void saveTimes()
            }
            disabled={
              savingTimes
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-100 py-3 font-black text-violet-600 transition active:scale-[0.98] disabled:opacity-50"
          >
            {savingTimes ? (
              <>
                <LoaderCircle
                  size={
                    17
                  }
                  className="animate-spin"
                />

                Guardando...
              </>
            ) : (
              <>
                <Save
                  size={
                    17
                  }
                />

                Guardar horarios
              </>
            )}
          </button>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 py-3 text-sm font-bold text-zinc-500">
            <Check
              size={
                16
              }
            />

            {timesSaved
              ? 'Horarios actualizados'
              : 'Horarios guardados'}
          </div>
        )}
      </div>

      {!supported && (
        <p className="mt-3 text-xs font-semibold leading-relaxed text-orange-500">
          Este dispositivo o
          navegador todavía no
          permite activar las
          notificaciones de Racha.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
          <p className="text-xs font-bold leading-relaxed text-red-500">
            {
              error
            }
          </p>
        </div>
      )}
    </section>
  )
}

export default NotificationSettings