import {
  useState,
} from 'react'

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import {
  createDateKey,
  formatDateKey,
  monthNames,
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

  onBack: () => void
}

function Calendar({
  activities,
  users,
  currentUserId,
  today,
  onSelectDate,
  onBack,
}: Props) {
  /*
   * ========================================
   * MES ACTUAL DEL CALENDARIO
   * ========================================
   */

  const [
    calendarDate,
    setCalendarDate,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ),
  )

  /*
   * ========================================
   * FECHA DE HOY
   * ========================================
   */

  const todayKey =
    formatDateKey(today)

  /*
   * ========================================
   * AÑO Y MES MOSTRADO
   * ========================================
   */

  const calendarYear =
    calendarDate.getFullYear()

  const calendarMonth =
    calendarDate.getMonth()

  /*
   * ========================================
   * DÍAS DEL MES
   * ========================================
   */

  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0,
    ).getDate()

  /*
   * ========================================
   * PRIMER DÍA DEL MES
   * ========================================
   *
   * JavaScript:
   *
   * 0 = domingo
   * 1 = lunes
   * ...
   *
   * Nuestro calendario empieza
   * en lunes.
   */

  const firstDayOfMonth =
    new Date(
      calendarYear,
      calendarMonth,
      1,
    ).getDay()

  const mondayOffset =
    (
      firstDayOfMonth +
      6
    ) % 7

  /*
   * ========================================
   * CELDAS DEL CALENDARIO
   * ========================================
   */

  const calendarCells:
    (number | null)[] = [
      ...Array(
        mondayOffset,
      ).fill(null),

      ...Array.from(
        {
          length:
            daysInMonth,
        },
        (_, index) =>
          index + 1,
      ),
    ]

  /*
   * Completamos la última semana
   * para que siempre tenga 7 columnas.
   */

  while (
    calendarCells.length %
      7 !==
    0
  ) {
    calendarCells.push(
      null,
    )
  }

  /*
   * ========================================
   * MES ANTERIOR
   * ========================================
   */

  const previousMonth =
    () => {
      setCalendarDate(
        new Date(
          calendarYear,
          calendarMonth - 1,
          1,
        ),
      )
    }

  /*
   * ========================================
   * MES SIGUIENTE
   * ========================================
   */

  const nextMonth =
    () => {
      setCalendarDate(
        new Date(
          calendarYear,
          calendarMonth + 1,
          1,
        ),
      )
    }

  /*
   * ========================================
   * VOLVER AL MES ACTUAL
   * ========================================
   */

  const goToToday =
    () => {
      setCalendarDate(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        ),
      )
    }

  /*
   * ¿Estamos viendo
   * el mes actual?
   */

  const isCurrentMonth =
    calendarYear ===
      today.getFullYear() &&
    calendarMonth ===
      today.getMonth()

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm transition active:scale-95"
        >
          <ArrowLeft
            size={20}
          />
        </button>

        <p className="text-sm font-bold text-violet-500">
          Tu grupo
        </p>

        <h1 className="text-3xl font-black text-zinc-800">
          Calendario
        </h1>

        <p className="mt-1 text-zinc-500">
          Mirá quién se movió
          cada día 👀
        </p>
      </header>

      {/* ================================= */}
      {/* CALENDARIO */}
      {/* ================================= */}

      <section className="rounded-[30px] bg-white p-4 shadow-sm">
        {/* ================================= */}
        {/* SELECTOR DE MES */}
        {/* ================================= */}

        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={
              previousMonth
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 transition active:scale-95"
          >
            <ChevronLeft
              size={20}
            />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-black capitalize text-zinc-800">
              {
                monthNames[
                  calendarMonth
                ]
              }{' '}
              {
                calendarYear
              }
            </h2>

            {!isCurrentMonth && (
              <button
                onClick={
                  goToToday
                }
                className="mt-1 text-xs font-bold text-violet-500"
              >
                Volver a hoy
              </button>
            )}
          </div>

          <button
            onClick={
              nextMonth
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500 transition active:scale-95"
          >
            <ChevronRight
              size={20}
            />
          </button>
        </div>

        {/* ================================= */}
        {/* DÍAS DE LA SEMANA */}
        {/* ================================= */}

        <div className="mb-2 grid grid-cols-7">
          {[
            'L',
            'M',
            'X',
            'J',
            'V',
            'S',
            'D',
          ].map(
            (day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-black text-zinc-400"
              >
                {day}
              </div>
            ),
          )}
        </div>

        {/* ================================= */}
        {/* GRILLA */}
        {/* ================================= */}

        <div className="grid grid-cols-7 gap-y-3">
          {calendarCells.map(
            (
              day,
              index,
            ) => {
              /*
               * Celda vacía.
               */

              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[74px]"
                  />
                )
              }

              /*
               * Fecha completa.
               */

              const dateKey =
                createDateKey(
                  calendarYear,
                  calendarMonth,
                  day,
                )

              /*
               * Actividades del día.
               */

              const dayActivities =
                activities[
                  dateKey
                ] ?? {}

              /*
               * Usuarios activos.
               *
               * Cada usuario aparece
               * solamente una vez,
               * aunque tenga varias
               * actividades.
               */

              const activeUsers =
                users.filter(
                  (user) =>
                    (
                      dayActivities[
                        user.id
                      ] ?? []
                    ).length >
                    0,
                )

              /*
               * Número total de
               * actividades del día.
               */

              const activityCount =
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

              const isToday =
                dateKey ===
                todayKey

              const currentUserActivities =
                dayActivities[
                  currentUserId
                ] ?? []

              const currentUserWasActive =
                currentUserActivities.length >
                0

              return (
                <button
                  key={
                    dateKey
                  }
                  onClick={() =>
                    onSelectDate(
                      dateKey,
                    )
                  }
                  className="relative flex h-[74px] flex-col items-center rounded-xl transition active:bg-zinc-50"
                >
                  {/* NÚMERO */}

                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-violet-500 text-white'
                        : currentUserWasActive
                          ? 'text-violet-600'
                          : 'text-zinc-600'
                    }`}
                  >
                    {day}
                  </div>

                  {/* AVATARES */}

                  <div className="mt-1 flex min-h-8 justify-center">
                    <div className="flex -space-x-3">
                      {activeUsers
                        .slice(
                          0,
                          3,
                        )
                        .map(
                          (
                            user,
                          ) => (
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

                  {/* MÁS USUARIOS */}

                  {activeUsers.length >
                    3 && (
                    <span className="mt-0.5 text-[9px] font-black text-violet-400">
                      +
                      {activeUsers.length -
                        3}
                    </span>
                  )}

                  {/* VARIAS ACTIVIDADES */}

                  {activityCount >
                    activeUsers.length && (
                    <div
                      className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-100 px-1 text-[8px] font-black text-orange-500"
                      title={`${activityCount} actividades`}
                    >
                      {
                        activityCount
                      }
                    </div>
                  )}
                </button>
              )
            },
          )}
        </div>

        {/* ================================= */}
        {/* LEYENDA */}
        {/* ================================= */}

        <div className="mt-5 border-t border-zinc-100 pt-4">
          <p className="mb-3 text-[10px] font-black tracking-wider text-zinc-400">
            INTEGRANTES
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {users.map(
              (user) => (
                <div
                  key={
                    user.id
                  }
                  className="flex items-center gap-2"
                >
                  <UserAvatar
                    user={
                      user
                    }
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
        </div>
      </section>

      {/* ================================= */}
      {/* INFO */}
      {/* ================================= */}

      <section className="mt-5 rounded-[25px] bg-violet-100 p-4">
      <p className="font-black text-violet-700">
  👥 Calendario del grupo
</p>

        <p className="mt-1 text-sm text-violet-500">
          Tocá cualquier día
          para ver todas las
          actividades del grupo
        </p>
      </section>

      {/* ================================= */}
      {/* ACLARACIÓN MULTIACTIVIDAD */}
      {/* ================================= */}

      <section className="mt-3 rounded-[25px] bg-orange-50 p-4">
        <p className="font-black text-orange-600">
          🏋️ + 🚶 + 🚲
        </p>

        <p className="mt-1 text-sm text-orange-500">
          Podés hacer varias
          actividades en un mismo
          día. El día sigue contando
          una sola vez para la racha.
        </p>
      </section>
    </div>
  )
}

export default Calendar