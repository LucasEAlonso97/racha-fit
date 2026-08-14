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

import UserAvatar from '../components/UserAvatar'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

function Rachas({
  activities,
  users,
  currentUserId,
  today,
}: Props) {
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

  const totalActivities =
    weekDates.reduce(
      (
        total,
        date,
      ) => {
        const key =
          formatDateKey(
            date,
          )

        return (
          total +
          Object.keys(
            activities[
              key
            ] ?? {},
          ).length
        )
      },
      0,
    )

  const perfectDays =
    weekDates.filter(
      (date) => {
        const key =
          formatDateKey(
            date,
          )

        return (
          users.length > 0 &&
          users.every(
            (user) =>
              Boolean(
                activities[
                  key
                ]?.[
                  user.id
                ],
              ),
          )
        )
      },
    ).length

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
      <header className="mb-7">
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

      {leader && (
        <section className="mb-5 rounded-[30px] bg-gradient-to-br from-violet-100 to-pink-100 p-5">
          <p className="text-xs font-black tracking-wider text-violet-500">
            ESTA SEMANA
          </p>

          <div className="mt-4 flex items-center gap-4">
            <UserAvatar
              user={
                leader.user
              }
              size="lg"
            />

            <div>
              <p className="text-xl font-black text-zinc-800">
                {leader.user.id ===
                currentUserId
                  ? 'Vas primero 👑'
                  : `${leader.user.name} va primero`}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {
                  leader.weekDays
                }{' '}
                días activos
              </p>
            </div>
          </div>

          {leader.user.id !==
            currentUserId &&
            difference > 0 && (
              <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-violet-600">
                Te lleva{' '}
                {difference}{' '}
                {difference === 1
                  ? 'día'
                  : 'días'}{' '}
                👀
              </p>
            )}
        </section>
      )}

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
            (item, index) => (
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
                  {medals[index] ??
                    `${index + 1}.`}
                </div>

                <UserAvatar
                  user={
                    item.user
                  }
                  size="md"
                />

                <div className="min-w-0 flex-1">
                  <p className="font-black text-zinc-800">
                    {item.user.id ===
                    currentUserId
                      ? 'Vos'
                      : item.user
                          .name}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {
                      item.weekDays
                    }{' '}
                    días esta semana
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
                  <p className="font-black text-zinc-800">
                    {item.user.id ===
                    currentUserId
                      ? 'Vos'
                      : item.user
                          .name}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Récord:{' '}
                    {
                      item.bestStreak
                    }{' '}
                    días
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
                    días
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[28px] bg-violet-100 p-5">
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
                perfectDays
              }
            </p>

            <p className="mt-1 text-xs font-semibold text-zinc-500">
              días donde se
              movieron todos
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Rachas