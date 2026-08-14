import {
  useEffect,
  useState,
} from 'react'

import {
  X,
} from 'lucide-react'

import {
  activityOptions,
  getActivityEmoji,
} from '../data/activities'

import type {
  Activity,
  ActivityType,
} from '../types'

type Props = {
  open: boolean
  activity?: Activity
  onClose: () => void
  onSave: (
    activity: Activity,
  ) => void
  onDelete: () => void
}

function ActivityModal({
  open,
  activity,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [
    activityType,
    setActivityType,
  ] =
    useState<ActivityType>(
      'Gym',
    )

  const [
    duration,
    setDuration,
  ] = useState(30)

  useEffect(() => {
    if (!open) {
      return
    }

    if (activity) {
      setActivityType(
        activity.type,
      )

      setDuration(
        activity.duration,
      )

      return
    }

    setActivityType('Gym')
    setDuration(30)
  }, [open, activity])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-t-[34px] bg-white px-5 pb-8 pt-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-violet-500">
              Tu racha
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              ¿Qué hiciste?
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {activityOptions.map(
            (option) => {
              const selected =
                activityType ===
                option.name

              return (
                <button
                  key={
                    option.name
                  }
                  onClick={() =>
                    setActivityType(
                      option.name,
                    )
                  }
                  className={`rounded-2xl border p-3 text-center transition ${
                    selected
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-100 bg-white'
                  }`}
                >
                  <span className="block text-2xl">
                    {
                      option.emoji
                    }
                  </span>

                  <span className="mt-1 block text-xs font-bold text-zinc-700">
                    {
                      option.name
                    }
                  </span>
                </button>
              )
            },
          )}
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold text-zinc-800">
              Duración
            </p>

            <span className="rounded-xl bg-violet-100 px-3 py-1 text-sm font-black text-violet-600">
              {duration} min
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={duration}
            onChange={(
              event,
            ) =>
              setDuration(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className="w-full accent-violet-500"
          />
        </div>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs font-bold text-zinc-400">
            TU ACTIVIDAD
          </p>

          <p className="mt-1 font-black text-zinc-800">
            {getActivityEmoji(
              activityType,
            )}{' '}
            {activityType} ·{' '}
            {duration} min
          </p>
        </div>

        <button
          onClick={() =>
            onSave({
              type: activityType,
              duration,
            })
          }
          className="mt-5 w-full rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
        >
          {activity
            ? 'Guardar cambios 🔥'
            : 'Sumar a mi racha 🔥'}
        </button>

        {activity && (
          <button
            onClick={onDelete}
            className="mt-3 w-full py-2 text-sm font-bold text-red-400"
          >
            Eliminar actividad
          </button>
        )}
      </div>
    </div>
  )
}

export default ActivityModal