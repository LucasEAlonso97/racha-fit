import {
  useState,
} from 'react'

import {
  Flame,
  Trophy,
  Users,
} from 'lucide-react'

import {
  getBestStreak,
  getCurrentStreak,
  getWeekActivityCount,
} from '../utils/activityStats'

import {
  formatDateKey,
  getWeekDates,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import Achievements from '../components/Achievements'
import GroupWeeklyGoal from '../components/GroupWeeklyGoal'
import UserAvatar from '../components/UserAvatar'
import WeeklySummary from '../components/WeeklySummary'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

type RachasTab =
  | 'summary'
  | 'ranking'
  | 'achievements'

function Rachas({
  activities,
  users,
  currentUserId,
  today,
}: Props) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<RachasTab>(
      'summary',
    )

  const weekDates =
    getWeekDates(today)

  const ranking =
    users
      .map((user) => ({
        user,

        weekDays:
          getWeekActivityCount(
            activities,
            user.id,
            today,
          ),

        currentStreak:
          getCurrentStreak(
            activities,
            user.id,
            today,
          ),

        bestStreak:
          getBestStreak(
            activities,
            user.id,
          ),
      }))
      .sort((a, b) => {
        if (
          b.weekDays !==
          a.weekDays
        ) {
          return (
            b.weekDays -
            a.weekDays
          )
        }

        return (
          b.currentStreak -
          a.currentStreak
        )
      })

  /*
   * ========================================
   * ESTADÍSTICAS DEL GRUPO
   * ========================================
   */

  const totalActivities =
    weekDates.reduce(
      (total, date) => {
        const key =
          formatDateKey(date)

        const dayActivities =
          activities[key] ?? {}

        const dayTotal =
          Object.values(
            dayActivities,
          ).reduce(
            (
              subtotal,
              userActivities,
            ) =>
              subtotal +
              userActivities.length,
            0,
          )

        return (
          total +
          dayTotal
        )
      },
      0,
    )

  const totalMinutes =
    weekDates.reduce(
      (total, date) => {
        const key =
          formatDateKey(date)

        const dayActivities =
          activities[key] ?? {}

        const dayMinutes =
          Object.values(
            dayActivities,
          ).reduce(
            (
              userTotal,
              userActivities,
            ) => {
              const minutes =
                userActivities.reduce(
                  (
                    subtotal,
                    activity,
                  ) =>
                    subtotal +
                    activity.duration,
                  0,
                )

              return (
                userTotal +
                minutes
              )
            },
            0,
          )

        return (
          total +
          dayMinutes
        )
      },
      0,
    )

  const perfectDays =
    weekDates.filter(
      (date) => {
        const key =
          formatDateKey(date)

        if (
          users.length === 0
        ) {
          return false
        }

        return users.every(
          (user) =>
            (
              activities[
                key
              ]?.[
                user.id
              ] ?? []
            ).length > 0,
        )
      },
    ).length

  /*
   * ========================================
   * LÍDER
   * ========================================
   */

  const leader =
    ranking[0]

  const currentUserStats =
    ranking.find(
      (item) =>
        item.user.id ===
        currentUserId,
    )

  const difference =
    leader &&
    currentUserStats
      ? leader.weekDays -
        currentUserStats.weekDays
      : 0

  const medals = [
    '🥇',
    '🥈',
    '🥉',
  ]

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-5">
        <p className="text-sm font-bold text-violet-500">
          Tu grupo
        </p>

        <h1 className="text-3xl font-black text-zinc-800">
          Rachas 🔥
        </h1>

        <p className="mt-1 text-zinc-500">
          A ver quién se está
          haciendo el vivo esta
          semana.
        </p>
      </header>

      {/* ================================= */}
      {/* TABS */}
      {/* ================================= */}

      <div className="mb-5 grid grid-cols-3 rounded-2xl bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'summary',
            )
          }
          className={`rounded-xl px-2 py-3 text-sm font-black transition ${
            activeTab ===
            'summary'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-zinc-400'
          }`}
        >
          Resumen
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'ranking',
            )
          }
          className={`rounded-xl px-2 py-3 text-sm font-black transition ${
            activeTab ===
            'ranking'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-zinc-400'
          }`}
        >
          Ranking
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab(
              'achievements',
            )
          }
          className={`rounded-xl px-2 py-3 text-sm font-black transition ${
            activeTab ===
            'achievements'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-zinc-400'
          }`}
        >
          Logros
        </button>
      </div>

      {/* ================================= */}
      {/* RESUMEN */}
      {/* ================================= */}

      {activeTab ===
        'summary' && (
        <>
          <GroupWeeklyGoal
            activities={
              activities
            }
            users={
              users
            }
            today={
              today
            }
          />

          {leader && (
            <section className="mb-5 flex items-center gap-4 rounded-[24px] bg-white px-4 py-3.5 shadow-sm">
              <UserAvatar
                user={
                  leader.user
                }
                size="lg"
              />

              <div className="min-w-0 flex-1">
                <p className="font-black text-zinc-800">
                  {leader.user.id ===
                  currentUserId
                    ? 'Vas primero 👑'
                    : `${leader.user.name} va primero`}
                </p>

                <p className="mt-0.5 text-sm text-zinc-500">
                  {
                    leader.weekDays
                  }{' '}
                  {leader.weekDays ===
                  1
                    ? 'día activo'
                    : 'días activos'}{' '}
                  esta semana
                </p>
              </div>

              {leader.user.id !==
                currentUserId &&
                difference > 0 && (
                  <div className="shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-center">
                    <p className="text-xs font-black text-violet-600">
                      -
                      {
                        difference
                      }
                    </p>

                    <p className="text-[10px] font-bold text-violet-400">
                      {difference ===
                      1
                        ? 'día'
                        : 'días'}
                    </p>
                  </div>
                )}
            </section>
          )}

          <WeeklySummary
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

          {/* LA BANDA */}

          <section className="mb-5 rounded-[28px] bg-violet-100 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users
                size={22}
                className="text-violet-600"
              />

              <h2 className="font-black text-violet-800">
                La banda
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-2xl font-black text-zinc-800">
                  {
                    totalActivities
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  actividades esta
                  semana
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-4">
                <p className="text-2xl font-black text-zinc-800">
                  {
                    totalMinutes
                  }
                </p>

                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  minutos acumulados
                </p>
              </div>

              <div className="col-span-2 rounded-2xl bg-white/70 p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-zinc-800">
                      {
                        perfectDays
                      }
                    </p>

                    <p className="mt-1 text-xs font-semibold text-zinc-500">
                      {perfectDays ===
                      1
                        ? 'día donde se movió todo el grupo'
                        : 'días donde se movió todo el grupo'}
                    </p>
                  </div>

                  <span className="text-3xl">
                    🤝
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-violet-200/50 px-4 py-3">
              <p className="text-xs font-bold leading-relaxed text-violet-700">
                🏋️ Podés registrar
                varias actividades
                por día, pero para
                la racha ese día
                cuenta una sola vez.
              </p>
            </div>
          </section>
        </>
      )}

      {/* ================================= */}
      {/* RANKING */}
      {/* ================================= */}

      {activeTab ===
        'ranking' && (
        <>
          {/* RANKING SEMANAL */}

          <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Trophy
                size={22}
                className="text-yellow-500"
              />

              <h2 className="text-lg font-black text-zinc-800">
                Ranking semanal
              </h2>
            </div>

            <div className="space-y-3">
              {ranking.map(
                (
                  item,
                  index,
                ) => (
                  <div
                    key={
                      item.user.id
                    }
                    className={`flex items-center gap-3 rounded-2xl p-3 ${
                      item.user.id ===
                      currentUserId
                        ? 'bg-violet-50'
                        : 'bg-zinc-50'
                    }`}
                  >
                    <div className="w-8 text-center text-xl">
                      {medals[
                        index
                      ] ??
                        `${index + 1}.`}
                    </div>

                    <UserAvatar
                      user={
                        item.user
                      }
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-zinc-800">
                        {item.user
                          .id ===
                        currentUserId
                          ? 'Vos'
                          : item
                              .user
                              .name}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {
                          item.weekDays
                        }{' '}
                        {item.weekDays ===
                        1
                          ? 'día activo'
                          : 'días activos'}{' '}
                        esta semana
                      </p>
                    </div>

                    <div className="flex items-center gap-1 font-black text-orange-500">
                      <Flame
                        size={18}
                        className="fill-orange-400"
                      />

                      {
                        item.currentStreak
                      }
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* RACHAS ACTUALES */}

          <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-black text-zinc-800">
              Rachas actuales
            </h2>

            <div className="space-y-4">
              {ranking.map(
                (item) => (
                  <div
                    key={
                      item.user.id
                    }
                    className="flex items-center gap-4"
                  >
                    <UserAvatar
                      user={
                        item.user
                      }
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-zinc-800">
                        {item.user
                          .id ===
                        currentUserId
                          ? 'Vos'
                          : item
                              .user
                              .name}
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        Récord:{' '}
                        {
                          item.bestStreak
                        }{' '}
                        {item.bestStreak ===
                        1
                          ? 'día'
                          : 'días'}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-orange-50 px-3 py-2 text-center">
                      <p className="text-xl">
                        🔥
                      </p>

                      <p className="text-xs font-black text-orange-500">
                        {
                          item.currentStreak
                        }{' '}
                        {item.currentStreak ===
                        1
                          ? 'día'
                          : 'días'}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>
        </>
      )}

      {/* ================================= */}
      {/* LOGROS */}
      {/* ================================= */}

      {activeTab ===
        'achievements' && (
        <Achievements
          activities={
            activities
          }
          currentUserId={
            currentUserId
          }
        />
      )}
    </div>
  )
}

export default Rachas