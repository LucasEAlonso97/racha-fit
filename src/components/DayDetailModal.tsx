import {
  Pencil,
  Plus,
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
  ReactionEmoji,
  User,
} from '../types'

import ReactionBar from './ReactionBar'
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
    activityId?: string | null,
  ) => void

  onReactActivity: (
    activityId: string,
    emoji: ReactionEmoji,
  ) => void | Promise<void>
}

function DayDetailModal({
  dateKey,
  todayKey,
  activities,
  users,
  currentUserId,
  onClose,
  onEditActivity,
  onReactActivity,
}: Props) {
  if (!dateKey) {
    return null
  }

  const date =
    parseDateKey(dateKey)

  const dayActivities =
    activities[
      dateKey
    ] ?? {}

  const currentUserActivities =
    dayActivities[
      currentUserId
    ] ?? []

  const totalActivities =
    Object.values(
      dayActivities,
    ).reduce(
      (
        total,
        userActivities,
      ) =>
        total +
        userActivities.length,
      0,
    )

  const activeUserCount =
    users.filter(
      (user) =>
        (
          dayActivities[
            user.id
          ] ?? []
        ).length > 0,
    ).length

  const isToday =
    dateKey ===
    todayKey

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-white px-5 pb-8 pt-5 shadow-2xl">
        {/* HEADER */}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold capitalize text-violet-500">
              {
                weekDayNames[
                  date.getDay()
                ]
              }
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {date.getDate()}{' '}
              de{' '}
              {
                monthNames[
                  date.getMonth()
                ]
              }
            </h2>

            {totalActivities >
              0 && (
              <p className="mt-1 text-sm text-zinc-400">
                {
                  activeUserCount
                }{' '}
                {activeUserCount ===
                1
                  ? 'persona activa'
                  : 'personas activas'}
                {' · '}
                {
                  totalActivities
                }{' '}
                {totalActivities ===
                1
                  ? 'actividad'
                  : 'actividades'}
              </p>
            )}
          </div>

          <button
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-95"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* VACÍO */}

        {totalActivities ===
          0 && (
          <div className="mb-5 rounded-[24px] bg-zinc-50 px-5 py-8 text-center">
            <div className="text-4xl">
              👀
            </div>

            <p className="mt-3 font-black text-zinc-700">
              Nadie se movió
              todavía
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              La cadena puede
              empezar acá.
            </p>
          </div>
        )}

        {/* USUARIOS */}

        <div className="space-y-4">
          {users.map(
            (user) => {
              const userActivities =
                dayActivities[
                  user.id
                ] ?? []

              const isCurrentUser =
                user.id ===
                currentUserId

              const hasActivities =
                userActivities.length >
                0

              return (
                <section
                  key={
                    user.id
                  }
                  className={`rounded-[24px] p-4 ${
                    isCurrentUser
                      ? 'bg-violet-50'
                      : 'bg-zinc-50'
                  }`}
                >
                  {/* USER */}

                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={
                        user
                      }
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-black text-zinc-800">
                          {isCurrentUser
                            ? 'Vos'
                            : user.name}
                        </p>

                        {hasActivities && (
                          <span className="text-lg">
                            🔥
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold text-zinc-400">
                        {hasActivities
                          ? `${
                              userActivities.length
                            } ${
                              userActivities.length ===
                              1
                                ? 'actividad'
                                : 'actividades'
                            }`
                          : 'Sin actividad'}
                      </p>
                    </div>
                  </div>

                  {/* ACTIVIDADES */}

                  {hasActivities && (
                    <div className="mt-4 space-y-3">
                      {userActivities.map(
                        (
                          activity,
                          index,
                        ) => {
                          const activityKey =
                            activity.id ??
                            `${activity.type}-${index}`

                          return (
                            <div
                              key={
                                activityKey
                              }
                              className="rounded-2xl bg-white p-3 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                {/* ICONO */}

                                <div
                                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                    isCurrentUser
                                      ? 'bg-violet-100'
                                      : 'bg-zinc-100'
                                  }`}
                                >
                                  {getActivityEmoji(
                                    activity.type,
                                  )}
                                </div>

                                {/* INFO */}

                                <div className="min-w-0 flex-1">
                                  <p className="font-black text-zinc-800">
                                    {
                                      activity.type
                                    }
                                  </p>

                                  <p className="mt-0.5 text-sm text-zinc-500">
                                    {
                                      activity.duration
                                    }{' '}
                                    min
                                  </p>
                                </div>

                                {/* EDITAR */}

                                {isCurrentUser &&
                                  activity.id && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditActivity(
                                          dateKey,
                                          activity.id ??
                                            null,
                                        )
                                      }
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 transition active:scale-95"
                                    >
                                      <Pencil
                                        size={
                                          16
                                        }
                                      />
                                    </button>
                                  )}
                              </div>

                              {/* REACCIONES */}

                              {activity.id && (
                                <ReactionBar
                                  reactions={
                                    activity.reactions ??
                                    []
                                  }
                                  currentUserId={
                                    currentUserId
                                  }
                                  onReact={(
                                    emoji,
                                  ) =>
                                    onReactActivity(
                                      activity.id!,
                                      emoji,
                                    )
                                  }
                                />
                              )}
                            </div>
                          )
                        },
                      )}
                    </div>
                  )}
                </section>
              )
            },
          )}
        </div>

        {/* AGREGAR */}

        {isToday && (
          <button
            onClick={() =>
              onEditActivity(
                dateKey,
                null,
              )
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
          >
            <Plus
              size={20}
              strokeWidth={3}
            />

            {currentUserActivities.length >
            0
              ? 'Agregar otra actividad'
              : 'Sumar mi actividad 🔥'}
          </button>
        )}

        {isToday &&
          currentUserActivities.length >
            1 && (
            <p className="mt-3 text-center text-xs font-semibold text-violet-400">
              Hiciste{' '}
              {
                currentUserActivities.length
              }{' '}
              actividades hoy.
              Igual suma 1 día a
              tu racha 🔥
            </p>
          )}
      </div>
    </div>
  )
}

export default DayDetailModal