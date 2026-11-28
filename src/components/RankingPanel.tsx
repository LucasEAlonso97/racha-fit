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

import Nickname from './Nickname'
import UserAvatar from './UserAvatar'

import {
  openMemberProfile,
} from '../lib/socialPanels'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

/*
 * ========================================
 * RANKING DE LA SEMANA
 * ========================================
 *
 * Por días activos. No cambia la racha del
 * grupo. (Antes vivía en Rachas; ahora en
 * Grupo → Ranking.)
 */
function RankingPanel({
  activities,
  users,
  currentUserId,
  today,
}: Props) {
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
    <>
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

                      <button
                        type="button"
                        aria-label={`Ver perfil de ${item.user.name}`}
                        onClick={() =>
                          openMemberProfile(
                            item.user.id,
                          )
                        }
                        className="shrink-0 transition active:scale-95"
                      >
                        <UserAvatar
                          user={
                            item.user
                          }
                          size="md"
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold text-zinc-800">
                            {item.user.id ===
                            currentUserId
                              ? 'Vos'
                              : item.user.name}
                          </p>

                          {completed && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-600">
                              META ✓
                            </span>
                          )}
                        </div>

                        <Nickname
                          userId={
                            item.user.id
                          }
                          className="mt-1"
                        />

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

                      <div className="flex items-center gap-1 font-bold text-orange-500">
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

            <p className="mt-1 text-xs font-semibold text-zinc-500">
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
                    <button
                      type="button"
                      aria-label={`Ver perfil de ${item.user.name}`}
                      onClick={() =>
                        openMemberProfile(
                          item.user.id,
                        )
                      }
                      className="shrink-0 transition active:scale-95"
                    >
                      <UserAvatar
                        user={
                          item.user
                        }
                        size="lg"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-zinc-800">
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

                      <p className="text-xs font-bold text-orange-500">
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
  )
}

export default RankingPanel
