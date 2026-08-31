import {
  useState,
} from 'react'

import {
  Flame,
  Trophy,
} from 'lucide-react'

import {
  getBestStreak,
  getCurrentStreak,
  getWeekActivityCount,
} from '../utils/activityStats'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import Achievements from '../components/Achievements'
import GroupHistoryPanel from '../components/GroupHistoryPanel'
import UserAvatar from '../components/UserAvatar'

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
}

type RachasTab =
  | 'history'
  | 'ranking'
  | 'achievements'

function Rachas({
  groupId,
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
      'history',
    )

  /*
   * ========================================
   * RANKING SEMANAL
   * ========================================
   */

  const ranking =
    users
      .map(
        (
          user,
        ) => ({
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
        }),
      )
      .sort(
        (
          a,
          b,
        ) => {
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
        },
      )

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
          Que no se corte
        </p>

        <h1 className="text-3xl font-black text-zinc-800">
          Rachas 🔥
        </h1>

        <p className="mt-1 text-zinc-500">
          La historia, la competencia
          y los logros de la banda.
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
              'history',
            )
          }
          className={`rounded-xl px-2 py-3 text-sm font-black transition ${
            activeTab ===
            'history'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-zinc-400'
          }`}
        >
          Historial
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
      {/* HISTORIAL */}
      {/* ================================= */}

      {activeTab ===
        'history' && (
        <GroupHistoryPanel
          groupId={
            groupId
          }
        />
      )}

      {/* ================================= */}
      {/* RANKING */}
      {/* ================================= */}

      {activeTab ===
        'ranking' && (
        <>
          <section className="mb-5 rounded-[24px] bg-violet-50 px-4 py-3">
            <p className="text-sm font-black text-violet-700">
              🏆 Competir está bueno.
              Llegar todos está mejor.
            </p>

            <p className="mt-1 text-xs font-semibold leading-relaxed text-violet-500">
              El ranking es por días
              activos y no modifica la
              racha del grupo.
            </p>
          </section>

          <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Trophy
                size={
                  22
                }
                className="text-yellow-500"
              />

              <h2 className="text-lg font-black text-zinc-800">
                Esta semana
              </h2>
            </div>

            <div className="space-y-3">
              {ranking.map(
                (
                  item,
                  index,
                ) => {
                  const goal =
                    item.user
                      .weeklyGoal ??
                    4

                  const completed =
                    item.weekDays >=
                    goal

                  return (
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
                        <div className="flex items-center gap-2">
                          <p className="truncate font-black text-zinc-800">
                            {item.user.id ===
                            currentUserId
                              ? 'Vos'
                              : item.user.name}
                          </p>

                          {completed && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black text-green-600">
                              META ✓
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {
                            item.weekDays
                          }
                          /
                          {
                            goal
                          }{' '}
                          días esta semana
                        </p>
                      </div>

                      <div className="flex items-center gap-1 font-black text-orange-500">
                        <Flame
                          size={
                            18
                          }
                          className="fill-orange-400"
                        />

                        {
                          item.currentStreak
                        }
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </section>

          <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-800">
              Rachas personales
            </h2>

            <p className="mt-1 text-xs font-semibold text-zinc-400">
              Siguen existiendo, pero
              ya no son el objetivo
              principal.
            </p>

            <div className="mt-5 space-y-4">
              {ranking.map(
                (
                  item,
                ) => (
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
                        {item.user.id ===
                        currentUserId
                          ? 'Vos'
                          : item.user.name}
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