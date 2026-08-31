import {
  useEffect,
  useState,
} from 'react'

import {
  Clock,
  LoaderCircle,
  Trash2,
  X,
} from 'lucide-react'

import {
  activityOptions,
} from '../data/activities'

import {
  monthNames,
  parseDateKey,
} from '../utils/date'

import type {
  Activity,
  ActivityType,
} from '../types'

type Props = {
  open: boolean

  activity?: Activity

  dateKey: string
  todayKey: string

  usesWildcard: boolean

  wildcardBalance:
    number | null

  onClose: () => void

  onSave: (
    activity: Activity,
  ) => void | Promise<void>

  onDelete:
    () => void | Promise<void>
}

function ActivityModal({
  open,
  activity,
  dateKey,
  todayKey,
  usesWildcard,
  wildcardBalance,
  onClose,
  onSave,
  onDelete,
}: Props) {
  /*
   * ========================================
   * ACTIVIDAD
   * ========================================
   */

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<ActivityType>(
      activity?.type ??
        'Gym',
    )

  /*
   * ========================================
   * DURACIÓN
   * ========================================
   */

  const [
    duration,
    setDuration,
  ] =
    useState(
      activity?.duration ??
        60,
    )

  /*
   * ========================================
   * ESTADOS
   * ========================================
   */

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    deleting,
    setDeleting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  /*
   * ========================================
   * TIPO DE FLUJO
   * ========================================
   */

  const isEditing =
    Boolean(
      activity?.id,
    )

  const isPastDay =
    dateKey <
    todayKey

  const date =
    parseDateKey(
      dateKey,
    )

  const formattedDate =
    `${date.getDate()} de ${
      monthNames[
        date.getMonth()
      ]
    }`

  /*
   * ========================================
   * RESET
   * ========================================
   */

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedType(
      activity?.type ??
        'Gym',
    )

    setDuration(
      activity?.duration ??
        60,
    )

    setSaving(false)
    setDeleting(false)
    setError(null)
  }, [
    open,
    activity,
  ])

  /*
   * ========================================
   * CERRAR
   * ========================================
   */

  const handleClose =
    () => {
      if (
        saving ||
        deleting
      ) {
        return
      }

      onClose()
    }

  /*
   * ========================================
   * GUARDAR
   * ========================================
   */

  const handleSave =
    async () => {
      setError(
        null,
      )

      if (
        duration <= 0
      ) {
        setError(
          'La duración tiene que ser mayor a 0 minutos.',
        )

        return
      }

      if (
        duration > 1440
      ) {
        setError(
          'Che, más de 24 horas ya es medio sospechoso jajaj.',
        )

        return
      }

      setSaving(
        true,
      )

      try {
        await onSave({
          id:
            activity?.id,

          type:
            selectedType,

          duration,
        })

        /*
         * Si onSave no cierra
         * por algún error controlado,
         * permitimos volver a tocar.
         */
        setSaving(
          false,
        )
      } catch (
        saveError
      ) {
        console.error(
          'Error guardando actividad:',
          saveError,
        )

        setError(
          'No pudimos guardar la actividad.',
        )

        setSaving(
          false,
        )
      }
    }

  /*
   * ========================================
   * ELIMINAR
   * ========================================
   */

  const handleDelete =
    async () => {
      if (
        !isEditing
      ) {
        return
      }

      const confirmed =
        window.confirm(
          '¿Querés eliminar esta actividad?',
        )

      if (!confirmed) {
        return
      }

      setError(
        null,
      )

      setDeleting(
        true,
      )

      try {
        await onDelete()
      } catch (
        deleteError
      ) {
        console.error(
          'Error eliminando actividad:',
          deleteError,
        )

        setError(
          'No pudimos eliminar la actividad.',
        )

        setDeleting(
          false,
        )
      }
    }

  /*
   * ========================================
   * CERRADO
   * ========================================
   */

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="max-h-[calc(100dvh-20px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[34px] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="sticky top-0 z-20 -mx-5 mb-5 flex items-start justify-between bg-white px-5 pb-3">
          <div>
            <p
              className={`text-sm font-bold ${
                usesWildcard
                  ? 'text-amber-600'
                  : 'text-violet-500'
              }`}
            >
              {isEditing
                ? 'Editar'
                : usesWildcard
                  ? '🃏 Recuperar día'
                  : isPastDay
                    ? 'Agregar actividad'
                    : 'Sumar actividad'}
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {isEditing
                ? '¿Qué hiciste?'
                : usesWildcard ||
                    isPastDay
                  ? '¿Qué hiciste ese día?'
                  : '¿Qué hiciste hoy?'}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {isEditing
                ? 'Podés cambiar el tipo o la duración.'
                : usesWildcard
                  ? `Actividad del ${formattedDate}.`
                  : isPastDay
                    ? `Actividad del ${formattedDate}.`
                    : 'Podés agregar todas las actividades que quieras.'}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              saving ||
              deleting
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-95 disabled:opacity-50"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ================================= */}
        {/* COMODÍN */}
        {/* ================================= */}

        {usesWildcard && (
          <section className="mb-5 rounded-[24px] bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                🃏
              </div>

              <div>
                <p className="font-black text-amber-800">
                  Vas a usar 1
                  comodín
                </p>

                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  Este día se
                  agregará a tu
                  historial y
                  contará normalmente
                  para tu racha.
                </p>

                {wildcardBalance !==
                  null && (
                  <p className="mt-2 text-xs font-black text-amber-600">
                    Tenés{' '}
                    {
                      wildcardBalance
                    }{' '}
                    {wildcardBalance ===
                    1
                      ? 'comodín disponible'
                      : 'comodines disponibles'}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* ACTIVIDAD */}
        {/* ================================= */}

        <section>
          <p className="mb-3 text-xs font-black tracking-wider text-zinc-400">
            ACTIVIDAD
          </p>

          <div className="grid grid-cols-2 gap-3">
            {activityOptions.map(
              (
                option,
              ) => {
                const selected =
                  selectedType ===
                  option.name

                return (
                  <button
                    key={
                      option.name
                    }
                    type="button"
                    onClick={() =>
                      setSelectedType(
                        option.name,
                      )
                    }
                    disabled={
                      saving ||
                      deleting
                    }
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                      selected
                        ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                        : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    <span className="text-2xl">
                      {
                        option.emoji
                      }
                    </span>

                    <span
                      className={`font-black ${
                        selected
                          ? 'text-violet-700'
                          : 'text-zinc-700'
                      }`}
                    >
                      {
                        option.name
                      }
                    </span>
                  </button>
                )
              },
            )}
          </div>
        </section>

        {/* ================================= */}
        {/* DURACIÓN */}
        {/* ================================= */}

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock
              size={17}
              className="text-violet-500"
            />

            <p className="text-xs font-black tracking-wider text-zinc-400">
              DURACIÓN
            </p>
          </div>

          <div className="rounded-[24px] bg-zinc-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setDuration(
                    (
                      current,
                    ) =>
                      Math.max(
                        5,
                        current -
                          5,
                      ),
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-violet-600 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                −
              </button>

              <div className="text-center">
                <div className="flex items-end justify-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={
                      duration
                    }
                    onChange={(
                      event,
                    ) => {
                      const value =
                        Number(
                          event
                            .target
                            .value,
                        )

                      setDuration(
                        Number.isNaN(
                          value,
                        )
                          ? 0
                          : value,
                      )
                    }}
                    disabled={
                      saving ||
                      deleting
                    }
                    className="w-24 bg-transparent text-center text-4xl font-black text-zinc-800 outline-none"
                  />

                  <span className="mb-1 font-bold text-zinc-400">
                    min
                  </span>
                </div>

                <p className="mt-1 text-xs font-semibold text-zinc-400">
                  Tiempo de
                  actividad
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDuration(
                    (
                      current,
                    ) =>
                      Math.min(
                        1440,
                        current +
                          5,
                      ),
                  )
                }
                disabled={
                  saving ||
                  deleting
                }
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-violet-600 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                +
              </button>
            </div>

            {/* ATAJOS */}

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                30,
                45,
                60,
                90,
              ].map(
                (
                  minutes,
                ) => (
                  <button
                    key={
                      minutes
                    }
                    type="button"
                    onClick={() =>
                      setDuration(
                        minutes,
                      )
                    }
                    disabled={
                      saving ||
                      deleting
                    }
                    className={`rounded-xl py-2 text-xs font-black transition ${
                      duration ===
                      minutes
                        ? 'bg-violet-500 text-white'
                        : 'bg-white text-zinc-500'
                    }`}
                  >
                    {
                      minutes
                    }{' '}
                    min
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        {/* ================================= */}
        {/* GUARDAR */}
        {/* ================================= */}

        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            saving ||
            deleting ||
            duration <= 0
          }
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black text-white transition active:scale-[0.98] disabled:opacity-50 ${
            usesWildcard
              ? 'bg-amber-500 shadow-lg shadow-amber-100'
              : 'bg-violet-500 shadow-lg shadow-violet-200'
          }`}
        >
          {saving ? (
            <>
              <LoaderCircle
                size={20}
                className="animate-spin"
              />

              Guardando...
            </>
          ) : isEditing ? (
            'Guardar cambios'
          ) : usesWildcard ? (
            '🃏 Usar comodín y guardar'
          ) : isPastDay ? (
            'Agregar actividad'
          ) : (
            'Sumar actividad'
          )}
        </button>

        {/* ================================= */}
        {/* ELIMINAR */}
        {/* ================================= */}

        {isEditing && (
          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={
              saving ||
              deleting
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-bold text-red-500 transition active:scale-[0.98] disabled:opacity-50"
          >
            {deleting ? (
              <>
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                Eliminando...
              </>
            ) : (
              <>
                <Trash2
                  size={18}
                />

                Eliminar
                actividad
              </>
            )}
          </button>
        )}

        {/* ================================= */}
        {/* ACLARACIÓN */}
        {/* ================================= */}

        {!isEditing &&
          !usesWildcard &&
          !isPastDay && (
            <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-zinc-400">
              Si después hacés
              otra cosa, la podés
              sumar también. El
              día cuenta una sola
              vez para tu racha.
            </p>
          )}

        {usesWildcard && (
          <p className="mt-4 text-center text-xs font-semibold leading-relaxed text-zinc-400">
            El comodín se consume
            al guardar la
            actividad.
          </p>
        )}
      </div>
    </div>
  )
}

export default ActivityModal