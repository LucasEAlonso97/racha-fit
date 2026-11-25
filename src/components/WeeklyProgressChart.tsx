import {
  useMemo,
  useState,
} from 'react'

import {
  TrendingDown,
  TrendingUp,
} from 'lucide-react'

import type {
  ActivitiesByDate,
  User,
} from '../types'

import {
  addDays,
  formatDateKey,
  getWeekDates,
  monthNames,
} from '../utils/date'

type Props = {
  activities: ActivitiesByDate
  user: User
  today: Date
}

type Metric = 'minutes' | 'days'

type Week = {
  start: Date
  minutes: number
  days: number
  current: boolean
}

const WEEKS = 12

function buildWeeks(
  activities: ActivitiesByDate,
  userId: string,
  today: Date,
): Week[] {
  const thisMonday =
    getWeekDates(today)[0]

  return Array.from(
    {
      length: WEEKS,
    },
    (_, index) => {
      const start = addDays(
        thisMonday,
        -7 * (WEEKS - 1 - index),
      )

      let minutes = 0
      let days = 0

      for (let day = 0; day < 7; day += 1) {
        const list =
          activities[
            formatDateKey(
              addDays(start, day),
            )
          ]?.[userId] ?? []

        if (list.length > 0) {
          days += 1
        }

        minutes += list.reduce(
          (total, activity) =>
            total +
            (Number(activity.duration) ||
              0),
          0,
        )
      }

      return {
        start,
        minutes,
        days,
        current: index === WEEKS - 1,
      }
    },
  )
}

function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((a, b) => a + b, 0) /
        values.length
}

function shortDate(date: Date) {
  return `${date.getDate()} ${monthNames[
    date.getMonth()
  ].slice(0, 3)}`
}

/*
 * ========================================
 * TU PROGRESO
 * ========================================
 *
 * Barras por semana de los últimos 3 meses,
 * en minutos o en días. La semana actual va
 * más clarita porque todavía no terminó.
 * Tendencia: últimas 4 semanas terminadas
 * contra las 4 anteriores.
 */
function WeeklyProgressChart({
  activities,
  user,
  today,
}: Props) {
  const [metric, setMetric] =
    useState<Metric>('minutes')

  const [selected, setSelected] =
    useState(WEEKS - 1)

  const weeks = useMemo(
    () =>
      buildWeeks(
        activities,
        user.id,
        today,
      ),
    [activities, user.id, today],
  )

  const valueOf = (week: Week) =>
    metric === 'minutes'
      ? week.minutes
      : week.days

  const finished = weeks.slice(0, -1)

  const recent = average(
    finished.slice(-4).map(valueOf),
  )

  const before = average(
    finished.slice(-8, -4).map(valueOf),
  )

  const trend =
    before > 0
      ? Math.round(
          ((recent - before) / before) *
            100,
        )
      : null

  const avg = average(
    finished.map(valueOf),
  )

  const goal =
    metric === 'days'
      ? user.weeklyGoal
      : null

  const max = Math.max(
    1,
    goal ?? 0,
    ...weeks.map(valueOf),
  )

  const selectedWeek = weeks[selected]

  const hasData = weeks.some(
    (week) => week.days > 0,
  )

  return (
    <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-wider text-violet-500">
            TU PROGRESO
          </p>

          <p className="mt-0.5 text-lg font-black text-zinc-800">
            Últimos 3 meses
          </p>
        </div>

        <div className="flex rounded-xl bg-zinc-100 p-1 text-[11px] font-black">
          {(
            [
              ['minutes', 'Minutos'],
              ['days', 'Días'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={
                metric === value
              }
              onClick={() =>
                setMetric(value)
              }
              className={`rounded-lg px-2.5 py-1.5 transition ${
                metric === value
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <p className="mt-6 rounded-2xl bg-zinc-50 px-4 py-6 text-center text-sm font-semibold text-zinc-400">
          Cuando cargues actividades, acá vas a
          ver cómo venís semana a semana.
        </p>
      ) : (
        <>
          {/* Resumen */}

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-zinc-400">
                {selectedWeek.current
                  ? 'Esta semana (en curso)'
                  : `Semana del ${shortDate(selectedWeek.start)}`}
              </p>

              <p className="text-2xl font-black text-zinc-800">
                {valueOf(selectedWeek)}{' '}
                <span className="text-sm font-bold text-zinc-400">
                  {metric === 'minutes'
                    ? 'min'
                    : valueOf(selectedWeek) ===
                        1
                      ? 'día'
                      : 'días'}
                </span>
              </p>
            </div>

            {trend !== null && (
              <div
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                  trend >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-500'
                }`}
              >
                {trend >= 0 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                {trend > 0 ? '+' : ''}
                {trend}% vs. el mes anterior
              </div>
            )}
          </div>

          {/* Barras */}

          <div className="relative mt-4 h-36">
            {/* Promedio */}
            {avg > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-300"
                style={{
                  bottom: `${(avg / max) * 100}%`,
                }}
              >
                <span className="absolute -top-4 right-0 rounded bg-white px-1 text-[9px] font-bold text-zinc-400">
                  promedio
                </span>
              </div>
            )}

            {/* Meta (en días) */}
            {goal !== null && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t-2 border-emerald-300"
                style={{
                  bottom: `${(goal / max) * 100}%`,
                }}
              >
                <span className="absolute -top-4 left-0 rounded bg-white px-1 text-[9px] font-black text-emerald-500">
                  meta {goal}
                </span>
              </div>
            )}

            <div className="flex h-full items-end gap-1.5">
              {weeks.map((week, index) => {
                const value = valueOf(week)

                const isSelected =
                  index === selected

                return (
                  <button
                    key={week.start.toISOString()}
                    type="button"
                    aria-label={`Semana del ${shortDate(week.start)}: ${value} ${metric === 'minutes' ? 'minutos' : 'días'}`}
                    onClick={() =>
                      setSelected(index)
                    }
                    className="flex h-full flex-1 items-end"
                  >
                    <span
                      className={`block w-full rounded-t-lg transition-all duration-500 ${
                        isSelected
                          ? 'bg-violet-600'
                          : week.current
                            ? 'bg-violet-200'
                            : 'bg-violet-400'
                      }`}
                      style={{
                        height: `${Math.max(
                          value > 0 ? 6 : 2,
                          (value / max) * 100,
                        )}%`,
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fechas */}

          <div className="mt-1.5 flex justify-between text-[9px] font-bold text-zinc-400">
            <span>
              {shortDate(weeks[0].start)}
            </span>
            <span>
              {shortDate(weeks[5].start)}
            </span>
            <span>Esta semana</span>
          </div>

          <p className="mt-3 text-[11px] font-semibold text-zinc-400">
            Promedio:{' '}
            {metric === 'minutes'
              ? `${Math.round(avg)} min por semana`
              : `${avg.toLocaleString('es-AR', {
                  maximumFractionDigits: 1,
                })} días por semana`}
            . Tocá una barra para ver esa
            semana.
          </p>
        </>
      )}
    </section>
  )
}

export default WeeklyProgressChart
