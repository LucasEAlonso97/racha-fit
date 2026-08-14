import {
  X,
} from 'lucide-react'

import {
  getActivityEmoji,
} from '../data/activities'

import {
  monthNames,
  parseDateKey,
  weekDayNames,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import UserAvatar from './UserAvatar'

type Props = {
  dateKey: string | null
  todayKey: string
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  onClose: () => void
  onEditActivity: (
    dateKey?: string,
  ) => void
}

function DayDetailModal({
  dateKey,
  todayKey,
  activities,
  users,
  currentUserId,
  onClose,
  onEditActivity,
}: Props) {
  if (!dateKey) {
    return null
  }

  const date =
    parseDateKey(dateKey)

  const dayActivities =
    activities[dateKey] ?? {}

  const currentUserActivity =
    dayActivities[
      currentUserId
    ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-t-[34px] bg-white px-5 pb-8 pt-5 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold capitalize text-violet-500">
              {
                weekDayNames[
                  date.getDay()
                ]
              }
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {date.getDate()} de{' '}
              {
                monthNames[
                  date.getMonth()
                ]
              }
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {users.map(
            (user) => {
              const activity =
                dayActivities[
                  user.id
                ]

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 rounded-2xl p-4 ${
                    user.id ===
                    currentUserId
                      ? 'bg-violet-50'
                      : 'bg-zinc-50'
                  }`}
                >
                  <UserAvatar
                    user={user}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-zinc-800">
                      {user.id ===
                      currentUserId
                        ? 'Vos'
                        : user.name}
                    </p>

                    {activity ? (
                      <p className="mt-1 text-sm text-zinc-500">
                        {getActivityEmoji(
                          activity.type,
                        )}{' '}
                        {activity.type} ·{' '}
                        {
                          activity.duration
                        }{' '}
                        min
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">
                        Sin actividad
                      </p>
                    )}
                  </div>

                  {activity && (
                    <span className="text-xl">
                      🔥
                    </span>
                  )}
                </div>
              )
            },
          )}
        </div>

        {dateKey ===
          todayKey && (
          <button
            onClick={() =>
              onEditActivity(
                dateKey,
              )
            }
            className="mt-5 w-full rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200"
          >
            {currentUserActivity
              ? 'Editar mi actividad'
              : 'Sumar mi actividad 🔥'}
          </button>
        )}
      </div>
    </div>
  )
}

export default DayDetailModal