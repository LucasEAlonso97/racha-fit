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

  const todayKey =
    formatDateKey(today)

  const calendarYear =
    calendarDate.getFullYear()

  const calendarMonth =
    calendarDate.getMonth()

  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0,
    ).getDate()

  const firstDayOfMonth =
    new Date(
      calendarYear,
      calendarMonth,
      1,
    ).getDay()

  const mondayOffset =
    (firstDayOfMonth + 6) %
    7

  const calendarCells: (
    | number
    | null
  )[] = [
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

  while (
    calendarCells.length %
      7 !==
    0
  ) {
    calendarCells.push(
      null,
    )
  }

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

  const nextMonth = () => {
    setCalendarDate(
      new Date(
        calendarYear,
        calendarMonth + 1,
        1,
      ),
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-8">
      <header className="mb-7">
        <button
          onClick={onBack}
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-600 shadow-sm"
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

      <section className="rounded-[30px] bg-white p-4 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={
              previousMonth
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500"
          >
            <ChevronLeft
              size={20}
            />
          </button>

          <h2 className="text-xl font-black capitalize text-zinc-800">
            {
              monthNames[
                calendarMonth
              ]
            }{' '}
            {calendarYear}
          </h2>

          <button
            onClick={
              nextMonth
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 text-zinc-500"
          >
            <ChevronRight
              size={20}
            />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7">
          {[
            'L',
            'M',
            'X',
            'J',
            'V',
            'S',
            'D',
          ].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-black text-zinc-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-3">
          {calendarCells.map(
            (day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-[70px]"
                  />
                )
              }

              const dateKey =
                createDateKey(
                  calendarYear,
                  calendarMonth,
                  day,
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
                  className="flex h-[70px] flex-col items-center"
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isToday
                        ? 'bg-violet-500 text-white'
                        : 'text-zinc-600'
                    }`}
                  >
                    {day}
                  </div>

                  <div className="mt-1 flex justify-center -space-x-3">
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
                </button>
              )
            },
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-t border-zinc-100 pt-4">
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

      <section className="mt-5 rounded-[25px] bg-violet-100 p-4">
        <p className="font-black text-violet-700">
          🔥 Calendario de la
          racha
        </p>

        <p className="mt-1 text-sm text-violet-500">
          Tocá cualquier día
          para ver qué hizo
          cada uno.
        </p>
      </section>
    </div>
  )
}

export default Calendar