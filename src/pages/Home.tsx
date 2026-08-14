import {
  Flame,
  Trophy,
} from 'lucide-react'

import {
  getActivityEmoji,
} from '../data/activities'

import {
  getBestStreak,
  getCurrentStreak,
  getWeekActivityCount,
} from '../utils/activityStats'

import {
  formatDateKey,
  getWeekDates,
  monthNames,
  weekDayNames,
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
  onSelectDate: (
    dateKey: string,
  ) => void
  onAddActivity: () => void
}

function Home({
  activities,
  users,
  currentUserId,
  today,
  onSelectDate,
  onAddActivity,
}: Props) {
  const todayKey =
    formatDateKey(today)

  const currentUser =
    users.find(
      (user) =>
        user.id ===
        currentUserId,
    )

  if (!currentUser) {
    return null
  }

  const weekDates =
    getWeekDates(today)

  const weeklyGoal = 5

  const weekActivityCount =
    getWeekActivityCount(
      activities,
      currentUserId,
      today,
    )

  const weeklyProgress =
    Math.min(
      (weekActivityCount /
        weeklyGoal) *
        100,
      100,
    )

  const currentStreak =
    getCurrentStreak(
      activities,
      currentUserId,
      today,
    )

  const bestStreak =
    getBestStreak(
      activities,
      currentUserId,
    )

  const todayActivities =
    activities[todayKey] ?? {}

  const myActivity =
    todayActivities[
      currentUserId
    ]

  const todayOtherUsers =
    users.filter(
      (user) =>
        user.id !==
          currentUserId &&
        todayActivities[
          user.id
        ],
    )

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      <header className="mb-7">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-violet-500">
              {
                weekDayNames[
                  today.getDay()
                ]
              }
              , {today.getDate()}{' '}
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
            user={currentUser}
            size="lg"
          />
        </div>

        <p className="text-zinc-500">
          Un día más cuenta.
        </p>
      </header>

      {/* RACHA */}

      <section className="mb-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-100 to-pink-50 p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-black tracking-wider text-violet-500">
              TU RACHA
            </p>

            <div className="mt-1 flex items-center gap-2">
              <Flame
                size={34}
                className="fill-orange-400 text-orange-400"
              />

              <span className="text-4xl font-black text-zinc-800">
                {currentStreak}
              </span>

              <span className="mt-2 font-semibold text-zinc-600">
                días
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/80 px-4 py-2 text-center shadow-sm">
            <p className="text-xs font-semibold text-zinc-400">
              Mejor
            </p>

            <p className="font-black text-violet-600">
              {bestStreak} días
            </p>
          </div>
        </div>

        {/* SEMANA */}

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map(
            (date) => {
              const dateKey =
                formatDateKey(
                  date,
                )

              const dayActivities =
                activities[
                  dateKey
                ] ?? {}

              const activeUsers =
                users.filter(
                  (user) =>
                    Boolean(
                      dayActivities[
                        user.id
                      ],
                    ),
                )

              const isToday =
                dateKey ===
                todayKey

              return (
                <button
                  key={dateKey}
                  onClick={() =>
                    onSelectDate(
                      dateKey,
                    )
                  }
                  className="text-center"
                >
                  <p className="mb-1 text-xs font-bold text-zinc-400">
                    {
                      [
                        'D',
                        'L',
                        'M',
                        'M',
                        'J',
                        'V',
                        'S',
                      ][
                        date.getDay()
                      ]
                    }
                  </p>

                  <div
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isToday
                        ? 'bg-violet-500 text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="mt-2 flex min-h-10 justify-center">
                    <div className="flex -space-x-3">
                      {activeUsers.map(
                        (user) => (
                          <UserAvatar
                            key={
                              user.id
                            }
                            user={
                              user
                            }
                            size="sm"
                          />
                        ),
                      )}
                    </div>
                  </div>
                </button>
              )
            },
          )}
        </div>

        {/* LEYENDA */}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-violet-200/70 pt-4">
          {users.map(
            (user) => (
              <div
                key={user.id}
                className="flex items-center gap-2"
              >
                <UserAvatar
                  user={user}
                  size="sm"
                />

                <span className="text-xs font-semibold text-zinc-500">
                  {user.id ===
                  currentUserId
                    ? 'Vos'
                    : user.name}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* META */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black tracking-wider text-zinc-400">
              META SEMANAL
            </p>

            <h2 className="mt-1 text-xl font-black text-zinc-800">
              {weekActivityCount}{' '}
              de {weeklyGoal} días
            </h2>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100">
            <Trophy
              size={25}
              className="text-yellow-600"
            />
          </div>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-violet-100">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{
              width: `${weeklyProgress}%`,
            }}
          />
        </div>

        <p className="mt-3 text-sm font-semibold text-violet-600">
          {weekActivityCount >=
          weeklyGoal
            ? 'Meta completada 🔥'
            : `Te faltan ${
                weeklyGoal -
                weekActivityCount
              } días`}
        </p>
      </section>

      {/* GRUPO HOY */}

      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-black tracking-wider text-zinc-400">
            HOY
          </p>

          <p className="text-xs font-bold text-violet-500">
            Tu grupo
          </p>
        </div>

        {todayOtherUsers.length >
        0 ? (
          <div className="space-y-4">
            {todayOtherUsers.map(
              (user) => {
                const activity =
                  todayActivities[
                    user.id
                  ]

                if (!activity) {
                  return null
                }

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4"
                  >
                    <UserAvatar
                      user={user}
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-zinc-800">
                        {user.name}{' '}
                        ya sumó su día
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {getActivityEmoji(
                          activity.type,
                        )}{' '}
                        {activity.type}{' '}
                        ·{' '}
                        {
                          activity.duration
                        }{' '}
                        min
                      </p>
                    </div>

                    <span className="text-xl">
                      🔥
                    </span>
                  </div>
                )
              },
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500">
            Nadie del grupo
            sumó actividad
            todavía 👀
          </div>
        )}

        {myActivity ? (
          <div className="mt-5">
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="font-bold text-green-700">
                ✓ Vos también
                sumaste hoy
              </p>

              <p className="mt-1 text-sm text-green-600">
                {getActivityEmoji(
                  myActivity.type,
                )}{' '}
                {myActivity.type} ·{' '}
                {myActivity.duration}{' '}
                min
              </p>
            </div>

            <button
              onClick={
                onAddActivity
              }
              className="mt-3 w-full rounded-2xl bg-zinc-100 py-3 font-bold text-zinc-600 transition active:scale-[0.98]"
            >
              Editar actividad
            </button>
          </div>
        ) : (
          <button
            onClick={
              onAddActivity
            }
            className="mt-5 w-full rounded-2xl bg-violet-500 py-3.5 font-bold text-white shadow-lg shadow-violet-100 transition active:scale-[0.98]"
          >
            Sumar mi actividad
          </button>
        )}
      </section>

      <section className="rounded-[28px] bg-pink-100 px-5 py-4">
        <p className="font-black text-pink-600">
          🔥 No cortes la cadena.
        </p>

        <p className="mt-1 text-sm text-pink-500">
          {todayOtherUsers.length >
          0
            ? 'Ellos ya se movieron. ¿Vos qué onda?'
            : 'Hoy la racha puede arrancar con vos.'}
        </p>
      </section>
    </div>
  )
}

export default Home