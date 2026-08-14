export const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export const weekDayNames = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]

export function formatDateKey(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function createDateKey(
  year: number,
  month: number,
  day: number,
) {
  return formatDateKey(
    new Date(
      year,
      month,
      day,
    ),
  )
}

export function addDays(
  date: Date,
  amount: number,
) {
  const copy =
    new Date(date)

  copy.setDate(
    copy.getDate() +
      amount,
  )

  return copy
}

export function getWeekDates(
  today: Date,
) {
  const currentDay =
    today.getDay()

  const mondayOffset =
    currentDay === 0
      ? -6
      : 1 - currentDay

  return Array.from(
    {
      length: 7,
    },
    (_, index) =>
      addDays(
        today,
        mondayOffset +
          index,
      ),
  )
}

export function parseDateKey(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T12:00:00`,
  )
}