import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'
import {
  useMemo,
  useState,
} from 'react'

import {
  LoaderCircle,
  X,
} from 'lucide-react'

import {
  countDays,
  getChallengePresets,
  MAX_CHALLENGE_DAYS,
} from '../lib/challenges'

import type {
  Challenge,
} from '../lib/challenges'

import {
  formatDateKey,
  monthNames,
} from '../utils/date'

type Props = {
  today: Date
  onClose: () => void
  onCreate: (
    input: Pick<
      Challenge,
      | 'title'
      | 'target_days'
      | 'starts_on'
      | 'ends_on'
    >,
  ) => Promise<boolean>
}

function capitalize(text: string) {
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  )
}

/*
 * ========================================
 * CREAR DESAFÍO
 * ========================================
 */

function CreateChallengeModal({
  today,
  onClose,
  onCreate,
}: Props) {
  const sheetRef =
    useSwipeToClose(onClose)

  const presets = useMemo(
    () => getChallengePresets(today),
    [today],
  )

  const nextMonthName = capitalize(
    monthNames[
      (today.getMonth() + 1) % 12
    ],
  )

  const [startsOn, setStartsOn] =
    useState(presets[1].starts_on)

  const [endsOn, setEndsOn] = useState(
    presets[1].ends_on,
  )

  const [title, setTitle] = useState(
    `Desafío de ${nextMonthName.toLowerCase()}`,
  )

  const [targetDays, setTargetDays] =
    useState(20)

  const [saving, setSaving] =
    useState(false)

  const todayKey = formatDateKey(today)

  const totalDays =
    endsOn >= startsOn
      ? countDays(startsOn, endsOn)
      : 0

  const error =
    !title.trim()
      ? 'Ponele un nombre.'
      : endsOn < startsOn
        ? 'La fecha de fin tiene que ser después del inicio.'
        : endsOn < todayKey
          ? 'El desafío ya habría terminado.'
          : totalDays > MAX_CHALLENGE_DAYS
            ? 'Puede durar hasta 3 meses.'
            : targetDays < 1
              ? 'La meta tiene que ser de al menos 1 día.'
              : targetDays > totalDays
                ? `La meta no puede ser mayor a ${totalDays} días.`
                : null

  const submit = async () => {
    if (error || saving) {
      return
    }

    setSaving(true)

    const created = await onCreate({
      title: title.trim(),
      target_days: targetDays,
      starts_on: startsOn,
      ends_on: endsOn,
    })

    setSaving(false)

    if (created) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-violet-500">
              Nuevo desafío
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              ¿Quién se anima? 💪
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUÁNDO */}

        <p className="mb-2 mt-6 text-xs font-bold tracking-wide text-zinc-500">
          CUÁNDO
        </p>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const selected =
              preset.starts_on ===
                startsOn &&
              preset.ends_on === endsOn

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setStartsOn(
                    preset.starts_on,
                  )
                  setEndsOn(preset.ends_on)

                  /*
                   * Que la meta entre en
                   * el período elegido.
                   */
                  setTargetDays((current) =>
                    Math.min(
                      current,
                      countDays(
                        preset.starts_on,
                        preset.ends_on,
                      ),
                    ),
                  )

                  if (
                    preset.id ===
                    'next-month'
                  ) {
                    setTitle(
                      `Desafío de ${nextMonthName.toLowerCase()}`,
                    )
                  }
                }}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  selected
                    ? 'bg-violet-500 text-white'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {preset.id ===
                'next-month'
                  ? nextMonthName
                  : preset.label}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-xs font-bold text-zinc-500">
            Desde
            <input
              type="date"
              value={startsOn}
              onChange={(event) =>
                setStartsOn(
                  event.target.value,
                )
              }
              className="mt-1 w-full rounded-2xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-800 outline-none"
            />
          </label>

          <label className="text-xs font-bold text-zinc-500">
            Hasta
            <input
              type="date"
              value={endsOn}
              onChange={(event) =>
                setEndsOn(
                  event.target.value,
                )
              }
              className="mt-1 w-full rounded-2xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-800 outline-none"
            />
          </label>
        </div>

        {/* META */}

        <p className="mb-2 mt-6 text-xs font-bold tracking-wide text-zinc-500">
          META
        </p>

        <div className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4">
          <button
            type="button"
            aria-label="Menos días"
            onClick={() =>
              setTargetDays((current) =>
                Math.max(1, current - 1),
              )
            }
            className="h-11 w-11 rounded-xl bg-white text-xl font-black text-violet-600 shadow-sm"
          >
            −
          </button>

          <div className="flex-1 text-center">
            <p className="text-3xl font-black text-zinc-800">
              {targetDays}
            </p>

            <p className="text-xs font-semibold text-zinc-500">
              días con actividad
              {totalDays > 0 &&
                ` de ${totalDays}`}
            </p>
          </div>

          <button
            type="button"
            aria-label="Más días"
            onClick={() =>
              setTargetDays((current) =>
                Math.min(
                  MAX_CHALLENGE_DAYS,
                  current + 1,
                ),
              )
            }
            className="h-11 w-11 rounded-xl bg-white text-xl font-black text-violet-600 shadow-sm"
          >
            +
          </button>
        </div>

        {/* NOMBRE */}

        <p className="mb-2 mt-6 text-xs font-bold tracking-wide text-zinc-500">
          NOMBRE
        </p>

        <input
          value={title}
          maxLength={60}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          className="w-full rounded-2xl bg-zinc-50 px-4 py-3 font-bold text-zinc-800 outline-none"
        />

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={Boolean(error) || saving}
          onClick={() => void submit()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          {saving && (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          )}
          Lanzar desafío 🔥
        </button>

        <p className="mt-3 text-center text-xs text-zinc-500">
          Participa todo el grupo.
          Cuentan los días con al menos
          una actividad.
        </p>
      </div>
    </div>
  )
}

export default CreateChallengeModal
