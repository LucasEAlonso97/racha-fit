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
  /*
   * ========================================
   * SEMANA ACTUAL
   * ========================================
   */

  const weekDates =
    getWeekDates(today)

  /*
   * ========================================
   * RANKING
   * ========================================
   *
   * El ranking sigue usando
   * DÍAS ACTIVOS.
   *
   * No cantidad de actividades.
   *
   * Ejemplo:
   *
   * Lucas:
   * lunes = 3 actividades
   * martes = 2 actividades
   *
   * Resultado:
   * 2 días activos
   */

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
        /*
         * Primero:
         * días activos esta semana.
         */

        if (
          b.weekDays !==
          a.weekDays
        ) {
          return (
            b.weekDays -
            a.weekDays
          )
        }

        /*
         * Desempate:
         * racha actual.
         */

        return (
          b.currentStreak -
          a.currentStreak
        )
      })

  /*
   * ========================================
   * TOTAL DE ACTIVIDADES DE LA SEMANA
   * ========================================
   *
   * Acá sí contamos TODAS.
   *
   * Si Lucas hizo:
   *
   * Gym
   * Caminata
   * Bicicleta
   *
   * suma 3 actividades.
   */

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

        const dayActivities =
          activities[
            key
          ] ?? {}

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

  /*
   * ========================================
   * MINUTOS TOTALES DEL GRUPO
   * ========================================
   */

  const totalMinutes =
    weekDates.reduce(
      (
        total,
        date,
      ) => {
        const key =
          formatDateKey(
            date,
          )

        const dayActivities =
          activities[
            key
          ] ?? {}

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

  /*
   * ========================================
   * DÍAS PERFECTOS
   * ========================================
   *
   * Día perfecto =
   * todos los integrantes hicieron
   * al menos UNA actividad.
   */

  const perfectDays =
    weekDates.filter(
      (date) => {
        const key =
          formatDateKey(
            date,
          )

        if (
          users.length ===
          0
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

  /*
   * ========================================
   * ESTADÍSTICAS DEL USUARIO ACTUAL
   * ========================================
   */

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

  /*
   * ========================================
   * MEDALLAS
   * ========================================
   */

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

      {/* ================================= */}
      {/* LÍDER SEMANAL */}
      {/* ================================= */}

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

            <div className="min-w-0">
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
                {leader.weekDays ===
                1
                  ? 'día activo'
                  : 'días activos'}
              </p>
            </div>
          </div>

          {leader.user.id !==
            currentUserId &&
            difference > 0 && (
              <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-violet-600">
                Te lleva{' '}
                {
                  difference
                }{' '}
                {difference ===
                1
                  ? 'día'
                  : 'días'}{' '}
                👀
              </p>
            )}

          {leader.user.id !==
            currentUserId &&
            difference ===
              0 && (
              <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-violet-600">
                Están empatados.
                Esto se puso
                interesante 👀
              </p>
            )}
        </section>
      )}

      {/* ================================= */}
      {/* RANKING SEMANAL */}
      {/* ================================= */}

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
                {/* POSICIÓN */}

                <div className="w-8 text-center text-xl">
                  {medals[
                    index
                  ] ??
                    `${index + 1}.`}
                </div>

                {/* AVATAR */}

                <UserAvatar
                  user={
                    item.user
                  }
                  size="md"
                />

                {/* INFO */}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-zinc-800">
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
                    {item.weekDays ===
                    1
                      ? 'día activo'
                      : 'días activos'}{' '}
                    esta semana
                  </p>
                </div>

                {/* RACHA */}

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

      {/* ================================= */}
      {/* RACHAS ACTUALES */}
      {/* ================================= */}

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

      {/* ================================= */}
      {/* ESTADÍSTICAS DEL GRUPO */}
      {/* ================================= */}

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
          {/* ACTIVIDADES */}

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

          {/* MINUTOS */}

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

          {/* DÍAS PERFECTOS */}

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

        {/* ACLARACIÓN */}

        <div className="mt-4 rounded-2xl bg-violet-200/50 px-4 py-3">
          <p className="text-xs font-bold leading-relaxed text-violet-700">
            🏋️ Podés registrar
            varias actividades por
            día, pero para la racha
            ese día cuenta una sola
            vez.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Rachas