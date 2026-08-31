import {
  useState,
} from 'react'

import {
  Bell,
  ChevronDown,
  ChevronUp,
  History,
  LoaderCircle,
  RotateCcw,
  Trophy,
} from 'lucide-react'

import GroupStreakCard from '../components/GroupStreakCard'
import ReactionBar from '../components/ReactionBar'
import UserAvatar from '../components/UserAvatar'

import {
  getActivityEmoji,
} from '../data/activities'

import type {
  SocialNotification,
} from '../hooks/useSocialNotifications'

import {
  getWeekActivityCount,
} from '../utils/activityStats'

import {
  formatDateKey,
  monthNames,
  weekDayNames,
} from '../utils/date'

import type {
  ActivitiesByDate,
  ReactionEmoji,
  User,
} from '../types'

type Props = {
  groupId: string

  activities:
    ActivitiesByDate

  users:
    User[]

  currentUserId:
    string

  today:
    Date

  onSelectDate: (
    dateKey: string,
  ) => void

  onAddActivity:
    () => void

  onReactActivity: (
    activityId: string,
    emoji: ReactionEmoji,
  ) => void | Promise<void>

  socialNotifications:
    SocialNotification[]

  socialUnreadCount:
    number

  socialNotificationsLoading:
    boolean

  onMarkSocialNotificationsRead:
    () => void | Promise<void>
}

function Home({
  groupId,
  activities,
  users,
  currentUserId,
  today,
  onSelectDate,
  onAddActivity,
  onReactActivity,
  socialNotifications,
  socialUnreadCount,
  socialNotificationsLoading,
  onMarkSocialNotificationsRead,
}: Props) {
  /*
   * ========================================
   * NOVEDADES
   * ========================================
   */

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(
      false,
    )

  /*
   * ========================================
   * FECHA
   * ========================================
   */

  const todayKey =
    formatDateKey(
      today,
    )

  /*
   * ========================================
   * USUARIO ACTUAL
   * ========================================
   */

  const currentUser =
    users.find(
      (
        user,
      ) =>
        user.id ===
        currentUserId,
    )

  if (
    !currentUser
  ) {
    return null
  }

  /*
   * ========================================
   * META PERSONAL
   * ========================================
   */

  const weeklyGoal =
    currentUser.weeklyGoal ??
    4

  const weekActivityCount =
    getWeekActivityCount(
      activities,
      currentUserId,
      today,
    )

  const weeklyProgress =
    Math.min(
      (
        weekActivityCount /
        weeklyGoal
      ) *
        100,
      100,
    )

  const weeklyRemaining =
    Math.max(
      weeklyGoal -
        weekActivityCount,
      0,
    )

  /*
   * ========================================
   * ACTIVIDADES DE HOY
   * ========================================
   */

  const todayActivities =
    activities[
      todayKey
    ] ?? {}

  const myActivities =
    todayActivities[
      currentUserId
    ] ?? []

  const myTotalMinutes =
    myActivities.reduce(
      (
        total,
        activity,
      ) =>
        total +
        activity.duration,
      0,
    )

  const todayOtherUsers =
    users.filter(
      (
        user,
      ) =>
        user.id !==
          currentUserId &&
        (
          todayActivities[
            user.id
          ] ?? []
        ).length >
          0,
    )

  /*
   * ========================================
   * ACTIVIDAD RECIENTE
   * ========================================
   */

  const recentActivities =
    Object.entries(
      activities,
    )
      .flatMap(
        ([
          dateKey,
          day,
        ]) =>
          users.flatMap(
            (
              user,
            ) =>
              (
                day[
                  user.id
                ] ?? []
              ).map(
                (
                  activity,
                  index,
                ) => ({
                  activity,
                  user,
                  dateKey,
                  index,
                }),
              ),
          ),
      )
      .filter(
        (
          item,
        ) =>
          item.dateKey <=
          todayKey,
      )
      .sort(
        (
          a,
          b,
        ) => {
          const dateComparison =
            b.dateKey.localeCompare(
              a.dateKey,
            )

          if (
            dateComparison !==
            0
          ) {
            return dateComparison
          }

          return (
            b.index -
            a.index
          )
        },
      )
      .slice(
        0,
        5,
      )

  /*
   * ========================================
   * LABEL DE FECHA
   * ========================================
   */

  const getDateLabel = (
    dateKey: string,
  ) => {
    if (
      dateKey ===
      todayKey
    ) {
      return 'Hoy'
    }

    const activityDate =
      new Date(
        `${dateKey}T12:00:00`,
      )

    const todayDate =
      new Date(
        `${todayKey}T12:00:00`,
      )

    const difference =
      Math.round(
        (
          todayDate.getTime() -
          activityDate.getTime()
        ) /
          86400000,
      )

    if (
      difference ===
      1
    ) {
      return 'Ayer'
    }

    if (
      difference >=
        2 &&
      difference <=
        6
    ) {
      return (
        weekDayNames[
          activityDate.getDay()
        ]
      )
    }

    return `${activityDate.getDate()} de ${
      monthNames[
        activityDate.getMonth()
      ]
    }`
  }

  /*
   * ========================================
   * USUARIO PARA NOTIFICACIÓN
   * ========================================
   */

  const getNotificationUser = (
    notification:
      SocialNotification,
  ): User => {
    const existingUser =
      users.find(
        (
          user,
        ) =>
          user.id ===
          notification.actorUserId,
      )

    if (
      existingUser
    ) {
      return existingUser
    }

    return {
      id:
        notification.actorUserId,

      name:
        notification.actorName,

      avatar:
        notification.actorAvatar,

      fallback:
        notification.actorName
          .trim()
          .charAt(
            0,
          )
          .toUpperCase() ||
        '?',

      avatarColor:
        'bg-violet-500',

      weeklyGoal:
        4,
    }
  }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-7">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold capitalize text-violet-500">
              {
                weekDayNames[
                  today.getDay()
                ]
              }
              ,{' '}
              {
                today.getDate()
              }{' '}
              de{' '}
              {
                monthNames[
                  today.getMonth()
                ]
              }
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-800">
              Buen día,{' '}
              {
                currentUser.name
              }{' '}
              👋
            </h1>
          </div>

          <UserAvatar
            user={
              currentUser
            }
            size="lg"
          />
        </div>

        <p className="text-zinc-500">
          Un día más cuenta 🏋️‍♀️
        </p>
      </header>

      {/* ================================= */}
      {/* RACHA DEL GRUPO */}
      {/* ================================= */}

      <GroupStreakCard
        groupId={
          groupId
        }
        activities={
          activities
        }
        users={
          users
        }
        currentUserId={
          currentUserId
        }
        today={
          today
        }
      />

      {/* ================================= */}
      {/* META PERSONAL */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-wider text-zinc-400">
              TU META ESTA SEMANA
            </p>

            <h2 className="mt-1 text-xl font-black text-zinc-800">
              {
                weekActivityCount
              }{' '}
              de{' '}
              {
                weeklyGoal
              }{' '}
              días
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
            <Trophy
              size={
                25
              }
              className="text-yellow-600"
            />
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{
              width:
                `${weeklyProgress}%`,
            }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-violet-600">
            {weekActivityCount >=
            weeklyGoal
              ? 'Tu parte ya está hecha ✓'
              : weeklyRemaining ===
                  1
                ? 'Te falta 1 día'
                : `Te faltan ${weeklyRemaining} días`}
          </p>

          <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black text-violet-500">
            META{' '}
            {
              weeklyGoal
            }
          </span>
        </div>
      </section>

      {/* ================================= */}
      {/* HOY */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-wider text-zinc-400">
              HOY
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-800">
              La banda hoy
            </h2>
          </div>

          <p className="text-xs font-bold text-violet-500">
            {
              todayOtherUsers.length
            }{' '}
            activos
          </p>
        </div>

        {/* ================================= */}
        {/* OTROS USUARIOS */}
        {/* ================================= */}

        {todayOtherUsers.length >
        0 ? (
          <div className="space-y-4">
            {todayOtherUsers.map(
              (
                user,
              ) => {
                const userActivities =
                  todayActivities[
                    user.id
                  ] ?? []

                const totalMinutes =
                  userActivities.reduce(
                    (
                      total,
                      activity,
                    ) =>
                      total +
                      activity.duration,
                    0,
                  )

                const firstActivity =
                  userActivities[
                    0
                  ]

                return (
                  <button
                    key={
                      user.id
                    }
                    type="button"
                    onClick={() =>
                      onSelectDate(
                        todayKey,
                      )
                    }
                    className="flex w-full items-center gap-4 rounded-2xl bg-zinc-50 p-3 text-left transition active:scale-[0.99]"
                  >
                    <UserAvatar
                      user={
                        user
                      }
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-zinc-800">
                        {
                          user.name
                        }{' '}
                        ya se movió
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {userActivities.length ===
                        1 ? (
                          <>
                            {firstActivity &&
                              getActivityEmoji(
                                firstActivity.type,
                              )}{' '}
                            {
                              firstActivity?.type
                            }{' '}
                            ·{' '}
                            {
                              firstActivity?.duration
                            }{' '}
                            min
                          </>
                        ) : (
                          <>
                            💪{' '}
                            {
                              userActivities.length
                            }{' '}
                            actividades
                            {' · '}
                            {
                              totalMinutes
                            }{' '}
                            min
                          </>
                        )}
                      </p>
                    </div>

                    <span className="text-xl">
                      ✓
                    </span>
                  </button>
                )
              },
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500">
            Todavía nadie más del
            grupo sumó actividad hoy
            👀
          </div>
        )}

        {/* ================================= */}
        {/* MI ACTIVIDAD */}
        {/* ================================= */}

        {myActivities.length >
        0 ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() =>
                onSelectDate(
                  todayKey,
                )
              }
              className="w-full rounded-2xl bg-green-50 p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-green-700">
                    ✓ Vos también
                    sumaste hoy
                  </p>

                  <p className="mt-1 text-sm text-green-600">
                    {
                      myActivities.length
                    }{' '}
                    {myActivities.length ===
                    1
                      ? 'actividad'
                      : 'actividades'}
                    {' · '}
                    {
                      myTotalMinutes
                    }{' '}
                    min
                  </p>
                </div>

                <span className="text-xl">
                  💪
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {myActivities.map(
                  (
                    activity,
                    index,
                  ) => (
                    <span
                      key={
                        activity.id ??
                        `${activity.type}-${index}`
                      }
                      className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-green-700"
                    >
                      {getActivityEmoji(
                        activity.type,
                      )}{' '}
                      {
                        activity.type
                      }
                    </span>
                  ),
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={
                onAddActivity
              }
              className="mt-3 w-full rounded-2xl bg-violet-100 py-3 font-black text-violet-600 transition active:scale-[0.98]"
            >
              + Agregar otra actividad
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={
              onAddActivity
            }
            className="mt-5 w-full rounded-2xl bg-violet-500 py-3.5 font-black text-white shadow-lg shadow-violet-100 transition active:scale-[0.98]"
          >
            Sumar mi actividad
          </button>
        )}
      </section>

      {/* ================================= */}
      {/* NOVEDADES */}
      {/* ================================= */}

      <section className="mb-5 overflow-hidden rounded-[28px] bg-white shadow-sm">
        <button
          type="button"
          onClick={() =>
            setNotificationsOpen(
              (
                current,
              ) =>
                !current,
            )
          }
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Bell
              size={
                22
              }
            />

            {socialUnreadCount >
              0 && (
              <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white">
                {socialUnreadCount >
                9
                  ? '9+'
                  : socialUnreadCount}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black tracking-wider text-zinc-400">
              NOVEDADES
            </p>

            <p className="mt-1 font-black text-zinc-800">
              {socialUnreadCount >
              0
                ? `${socialUnreadCount} ${
                    socialUnreadCount ===
                    1
                      ? 'nueva'
                      : 'nuevas'
                  }`
                : 'Todo visto'}
            </p>
          </div>

          {notificationsOpen ? (
            <ChevronUp
              size={
                20
              }
              className="text-zinc-400"
            />
          ) : (
            <ChevronDown
              size={
                20
              }
              className="text-zinc-400"
            />
          )}
        </button>

        {notificationsOpen && (
          <div className="border-t border-zinc-100 px-5 pb-5">
            {socialNotificationsLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm font-bold text-zinc-400">
                <LoaderCircle
                  size={
                    18
                  }
                  className="animate-spin"
                />

                Cargando novedades...
              </div>
            ) : socialNotifications.length >
              0 ? (
              <>
                <div className="divide-y divide-zinc-100">
                  {socialNotifications
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        notification,
                      ) => {
                        const actor =
                          getNotificationUser(
                            notification,
                          )

                        /*
                         * ===========================
                         * EMPUJÓN
                         * ===========================
                         */

                        if (
                          notification.type ===
                          'nudge'
                        ) {
                          return (
                            <div
                              key={
                                notification.id
                              }
                              className="flex w-full items-center gap-3 py-4 text-left"
                            >
                              <div className="relative">
                                <UserAvatar
                                  user={
                                    actor
                                  }
                                  size="md"
                                />

                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-xs">
                                  👊
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-sm leading-relaxed text-zinc-600">
                                  <span className="font-black text-zinc-800">
                                    {
                                      notification.actorName
                                    }
                                  </span>{' '}
                                  te mandó
                                  un{' '}
                                  <span className="font-black text-orange-600">
                                    empujón
                                    👊
                                  </span>
                                </p>

                                <p className="mt-1 text-xs font-bold text-zinc-400">
                                  Dale,
                                  faltás vos.
                                </p>
                              </div>

                              {!notification.isRead && (
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
                              )}
                            </div>
                          )
                        }

                        /*
                         * ===========================
                         * REACCIÓN
                         * ===========================
                         */

                        return (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() => {
                              if (
                                notification.activityDate
                              ) {
                                onSelectDate(
                                  notification.activityDate,
                                )
                              }
                            }}
                            className="flex w-full items-center gap-3 py-4 text-left"
                          >
                            <div className="relative">
                              <UserAvatar
                                user={
                                  actor
                                }
                                size="md"
                              />

                              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-xs">
                                {
                                  notification.emoji ??
                                  '💪'
                                }
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-relaxed text-zinc-600">
                                <span className="font-black text-zinc-800">
                                  {
                                    notification.actorName
                                  }
                                </span>{' '}
                                reaccionó{' '}
                                <span className="font-black">
                                  {
                                    notification.emoji ??
                                    '💪'
                                  }
                                </span>{' '}
                                a tu{' '}
                                <span className="font-black text-zinc-800">
                                  {
                                    notification.activityType ??
                                    'actividad'
                                  }
                                </span>
                              </p>

                              <p className="mt-1 text-xs font-bold capitalize text-zinc-400">
                                {notification.activityDate
                                  ? getDateLabel(
                                      notification.activityDate,
                                    )
                                  : ''}

                                {notification.activityDate &&
                                  notification.activityDuration !==
                                    null &&
                                  ' · '}

                                {notification.activityDuration !==
                                  null && (
                                  <>
                                    {
                                      notification.activityDuration
                                    }{' '}
                                    min
                                  </>
                                )}
                              </p>
                            </div>

                            {!notification.isRead && (
                              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
                            )}
                          </button>
                        )
                      },
                    )}
                </div>

                {socialUnreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void onMarkSocialNotificationsRead()
                    }
                    className="mt-3 w-full rounded-2xl bg-violet-50 py-3 text-sm font-black text-violet-600 transition active:scale-[0.98]"
                  >
                    Marcar como
                    vistas
                  </button>
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="font-black text-zinc-600">
                  Todavía no hay
                  novedades
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Las reacciones y
                  los empujones de
                  la banda van a
                  aparecer acá.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================================= */}
      {/* ACTIVIDAD RECIENTE */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-wider text-zinc-400">
              ACTIVIDAD RECIENTE
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-800">
              Últimos movimientos
            </h2>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <History
              size={
                20
              }
            />
          </div>
        </div>

        {recentActivities.length >
        0 ? (
          <div className="space-y-4">
            {recentActivities.map(
              (
                item,
              ) => {
                const {
                  activity,
                  user,
                  dateKey,
                  index,
                } =
                  item

                const isMe =
                  user.id ===
                  currentUserId

                return (
                  <article
                    key={
                      activity.id ??
                      `${dateKey}-${user.id}-${activity.type}-${index}`
                    }
                    className="rounded-[22px] bg-zinc-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        user={
                          user
                        }
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-black text-zinc-800">
                            {isMe
                              ? 'Vos'
                              : user.name}
                          </p>

                          <span className="text-xs font-bold capitalize text-zinc-400">
                            {
                              getDateLabel(
                                dateKey,
                              )
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-semibold text-zinc-600">
                          {getActivityEmoji(
                            activity.type,
                          )}{' '}
                          {
                            activity.type
                          }{' '}
                          ·{' '}
                          {
                            activity.duration
                          }{' '}
                          min
                        </p>

                        {activity.recovered_with_wildcard && (
                          <div className="mt-2 flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                            <RotateCcw
                              size={
                                10
                              }
                              strokeWidth={
                                3
                              }
                            />

                            Día
                            recuperado
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectDate(
                            dateKey,
                          )
                        }
                        className="shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-violet-600 shadow-sm"
                      >
                        Ver
                      </button>
                    </div>

                    {activity.id && (
                      <div className="mt-1">
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
                      </div>
                    )}
                  </article>
                )
              },
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50 px-4 py-6 text-center">
            <p className="font-black text-zinc-600">
              Todavía está
              tranquilo por acá
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Cuando alguien del
              grupo registre una
              actividad va a
              aparecer acá.
            </p>
          </div>
        )}
      </section>

      {/* ================================= */}
      {/* MENSAJE FINAL */}
      {/* ================================= */}

      <section className="rounded-[28px] bg-pink-100 px-5 py-4">
        <p className="font-black text-pink-600">
          🔥 Que no se corte
        </p>

        <p className="mt-1 text-sm text-pink-500">
          {myActivities.length >
          0
            ? weekActivityCount >=
              weeklyGoal
              ? 'Tu parte ya está hecha. Ahora que llegue toda la banda.'
              : myActivities.length >
                  1
                ? `Hoy ya metiste ${myActivities.length} actividades. Dejá de farmear tanta aura jajaj.`
                : 'Ya sumaste tu día. Uno menos para salvar la semana.'
            : todayOtherUsers.length >
                0
              ? 'Ellos ya se movieron. ¿Vos qué onda?'
              : 'Todavía nadie arrancó hoy. Podés ser el primero.'}
        </p>
      </section>
    </div>
  )
}

export default Home