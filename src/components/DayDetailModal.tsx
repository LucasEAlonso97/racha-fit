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
    activityId?: string | null,
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
  /*
   * Si no hay fecha seleccionada,
   * el modal no se muestra.
   */

  if (!dateKey) {
    return null
  }

  /*
   * Convertimos:
   *
   * 2026-08-14
   *
   * a Date.
   */

  const date =
    parseDateKey(dateKey)

  /*
   * Actividades del día.
   *
   * Ejemplo:
   *
   * {
   *   lucas: [
   *     Gym,
   *     Caminata
   *   ],
   *
   *   edith: [
   *     Bicicleta
   *   ]
   * }
   */

  const dayActivities =
    activities[dateKey] ?? {}

  /*
   * Actividades del usuario actual.
   */

  const currentUserActivities =
    dayActivities[
      currentUserId
    ] ?? []

  /*
   * Cantidad total de actividades
   * del grupo ese día.
   */

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

  /*
   * Usuarios que hicieron
   * al menos una actividad.
   */

  const activeUserCount =
    users.filter(
      (user) =>
        (
          dayActivities[
            user.id
          ] ?? []
        ).length > 0,
    ).length

  /*
   * Por ahora seguimos dejando
   * agregar actividades únicamente
   * en el día de hoy.
   *
   * Más adelante podemos permitir
   * cargar días anteriores.
   */

  const isToday =
    dateKey === todayKey

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[34px] bg-white px-5 pb-8 pt-5 shadow-2xl">
        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

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
                {activeUserCount}{' '}
                {activeUserCount ===
                1
                  ? 'persona activa'
                  : 'personas activas'}
                {' · '}
                {totalActivities}{' '}
                {totalActivities ===
                1
                  ? 'actividad'
                  : 'actividades'}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-95"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ========================= */}
        {/* SIN ACTIVIDAD */}
        {/* ========================= */}

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

        {/* ========================= */}
        {/* USUARIOS */}
        {/* ========================= */}

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
                  {/* USUARIO */}

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
                    <div className="mt-4 space-y-2">
                      {userActivities.map(
                        (
                          activity,
                          index,
                        ) => {
                          /*
                           * Las actividades
                           * propias son editables.
                           */

                          if (
                            isCurrentUser
                          ) {
                            return (
                              <button
                                key={
                                  activity.id ??
                                  `${activity.type}-${index}`
                                }
                                onClick={() =>
                                  onEditActivity(
                                    dateKey,
                                    activity.id ??
                                      null,
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.99]"
                              >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xl">
                                  {getActivityEmoji(
                                    activity.type,
                                  )}
                                </div>

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

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
                                  <Pencil
                                    size={
                                      16
                                    }
                                  />
                                </div>
                              </button>
                            )
                          }

                          /*
                           * Actividades ajenas:
                           * solo lectura.
                           */

                          return (
                            <div
                              key={
                                activity.id ??
                                `${activity.type}-${index}`
                              }
                              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl">
                                {getActivityEmoji(
                                  activity.type,
                                )}
                              </div>

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

        {/* ========================= */}
        {/* AGREGAR ACTIVIDAD */}
        {/* ========================= */}

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

        {/* ========================= */}
        {/* MENSAJE FINAL */}
        {/* ========================= */}

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