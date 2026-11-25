import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import type {
  ActivitiesByDate,
} from '../types'

import {
  addDays,
  formatDateKey,
  monthNames,
  parseDateKey,
  weekDayNames,
} from '../utils/date'

type Props = {
  activities: ActivitiesByDate
  userId: string
  today: Date
}

type Cell = {
  dateKey: string
  inYear: boolean
  future: boolean
  minutes: number
  count: number
  recovered: boolean
}

/*
 * Intensidad según los minutos del día.
 */
function levelClass(cell: Cell) {
  if (!cell.inYear) {
    return 'bg-transparent'
  }

  if (cell.future) {
    return 'bg-zinc-50'
  }

  if (cell.count === 0) {
    return 'bg-zinc-100'
  }

  if (cell.recovered) {
    return 'bg-amber-300'
  }

  if (cell.minutes > 90) {
    return 'bg-violet-700'
  }

  if (cell.minutes > 60) {
    return 'bg-violet-500'
  }

  if (cell.minutes > 30) {
    return 'bg-violet-400'
  }

  return 'bg-violet-200'
}

function buildWeeks(
  activities: ActivitiesByDate,
  userId: string,
  year: number,
  todayKey: string,
) {
  const first = new Date(year, 0, 1, 12)

  /*
   * La grilla arranca el lunes de la
   * semana del 1 de enero.
   */
  const offset =
    (first.getDay() + 6) % 7

  let cursor = addDays(first, -offset)

  const weeks: Cell[][] = []

  while (cursor.getFullYear() <= year) {
    const week: Cell[] = []

    for (let day = 0; day < 7; day += 1) {
      const dateKey =
        formatDateKey(cursor)

      const list =
        activities[dateKey]?.[userId] ??
        []

      week.push({
        dateKey,
        inYear:
          cursor.getFullYear() === year,
        future: dateKey > todayKey,
        minutes: list.reduce(
          (total, activity) =>
            total +
            (Number(activity.duration) ||
              0),
          0,
        ),
        count: list.length,
        recovered: list.some(
          (activity) =>
            activity.recovered_with_wildcard,
        ),
      })

      cursor = addDays(cursor, 1)
    }

    weeks.push(week)

    /*
     * En el año actual, hasta la semana de
     * hoy (sin semanas vacías por venir).
     */
    if (
      cursor.getFullYear() > year ||
      formatDateKey(cursor) > todayKey
    ) {
      break
    }
  }

  return weeks
}

/*
 * ========================================
 * MAPA DE CALOR DEL AÑO
 * ========================================
 *
 * Un cuadradito por día, más oscuro cuanto
 * más entrenaste. Se puede tocar un día
 * para ver qué hiciste.
 */
function YearHeatmap({
  activities,
  userId,
  today,
}: Props) {
  const todayKey =
    formatDateKey(today)

  const currentYear =
    today.getFullYear()

  const [year, setYear] =
    useState(currentYear)

  const [selected, setSelected] =
    useState<string | null>(null)

  const scrollRef =
    useRef<HTMLDivElement>(null)

  /*
   * Primer año con actividades del usuario
   * (para no dejar ir más atrás).
   */
  const firstYear = useMemo(() => {
    const years = Object.keys(activities)
      .filter(
        (dateKey) =>
          (activities[dateKey]?.[userId] ??
            []).length > 0,
      )
      .map((dateKey) =>
        Number(dateKey.slice(0, 4)),
      )

    return years.length > 0
      ? Math.min(...years)
      : currentYear
  }, [activities, userId, currentYear])

  const weeks = useMemo(
    () =>
      buildWeeks(
        activities,
        userId,
        year,
        todayKey,
      ),
    [activities, userId, year, todayKey],
  )

  const trainedDays = weeks
    .flat()
    .filter(
      (cell) =>
        cell.inYear && cell.count > 0,
    ).length

  /*
   * Al abrir, se ve la semana actual (a la
   * derecha).
   */
  useEffect(() => {
    const element = scrollRef.current

    if (!element) {
      return
    }

    element.scrollLeft =
      year === currentYear
        ? element.scrollWidth
        : 0
  }, [year, currentYear])

  /*
   * Etiqueta del mes arriba de la primera
   * semana que lo contiene.
   */
  const monthLabels = weeks.map(
    (week) => {
      const firstOfMonth = week.find(
        (cell) =>
          cell.inYear &&
          cell.dateKey.endsWith('-01'),
      )

      return firstOfMonth
        ? monthNames[
            parseDateKey(
              firstOfMonth.dateKey,
            ).getMonth()
          ].slice(0, 3)
        : ''
    },
  )

  const selectedInfo = selected
    ? (() => {
        const list =
          activities[selected]?.[
            userId
          ] ?? []

        const date =
          parseDateKey(selected)

        const weekday =
          weekDayNames[date.getDay()]

        const label = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()} de ${monthNames[date.getMonth()]}`

        if (list.length === 0) {
          return `${label}: sin actividad`
        }

        return `${label}: ${list
          .map(
            (activity) =>
              `${activity.type} ${activity.duration} min`,
          )
          .join(' · ')}${
          list.some(
            (activity) =>
              activity.recovered_with_wildcard,
          )
            ? ' 🃏'
            : ''
        }`
      })()
    : null

  return (
    <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-wider text-violet-500">
            TU AÑO DÍA POR DÍA
          </p>

          <p className="mt-0.5 text-lg font-black text-zinc-800">
            {trainedDays}{' '}
            {trainedDays === 1
              ? 'día'
              : 'días'}{' '}
            en {year}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Año anterior"
            disabled={year <= firstYear}
            onClick={() => {
              setSelected(null)
              setYear(
                (current) => current - 1,
              )
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            aria-label="Año siguiente"
            disabled={year >= currentYear}
            onClick={() => {
              setSelected(null)
              setYear(
                (current) => current + 1,
              )
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {/* Días de la semana */}
        <div className="flex shrink-0 flex-col gap-[3px] pt-4 text-[9px] font-bold leading-[11px] text-zinc-400">
          {['L', '', 'M', '', 'V', '', 'D'].map(
            (label, index) => (
              <span
                key={index}
                className="h-[11px]"
              >
                {label}
              </span>
            ),
          )}
        </div>

        <div
          ref={scrollRef}
          data-no-swipe
          className="min-w-0 flex-1 overflow-x-auto pb-1 [scrollbar-width:none]"
        >
          <div className="flex w-max gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div
                key={week[0].dateKey}
                className="flex w-[11px] flex-col gap-[3px]"
              >
                <span className="h-[13px] w-[11px] overflow-visible whitespace-nowrap text-[9px] font-bold capitalize leading-none text-zinc-400">
                  {monthLabels[weekIndex]}
                </span>

                {week.map((cell) => (
                  <button
                    key={cell.dateKey}
                    type="button"
                    disabled={
                      !cell.inYear ||
                      cell.future
                    }
                    aria-label={cell.dateKey}
                    onClick={() =>
                      setSelected(
                        (current) =>
                          current ===
                          cell.dateKey
                            ? null
                            : cell.dateKey,
                      )
                    }
                    className={`h-[11px] w-[11px] rounded-[3px] ${levelClass(
                      cell,
                    )} ${
                      selected ===
                      cell.dateKey
                        ? 'ring-2 ring-zinc-800 ring-offset-1'
                        : cell.dateKey ===
                            todayKey
                          ? 'ring-1 ring-violet-500'
                          : ''
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-h-[16px] text-[11px] font-semibold text-zinc-500">
          {selectedInfo ??
            'Tocá un día para ver qué hiciste.'}
        </p>

        <div className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-zinc-400">
          Menos
          <span className="h-[9px] w-[9px] rounded-[2px] bg-zinc-100" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-violet-200" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-violet-400" />
          <span className="h-[9px] w-[9px] rounded-[2px] bg-violet-700" />
          Más
        </div>
      </div>
    </section>
  )
}

export default YearHeatmap
