/*
 * ========================================
 * TIEMPO QUE QUEDA PARA ELEGIR
 * ========================================
 */

export function getTimeLeft(
  deadline: string | null | undefined,
  now: Date = new Date(),
) {
  if (!deadline) {
    return null
  }

  const milliseconds =
    new Date(deadline).getTime() -
    now.getTime()

  return Math.max(0, milliseconds)
}

/*
 * "1 día y 5 horas", "5 horas",
 * "40 minutos", "unos minutos".
 */
export function formatTimeLeft(
  milliseconds: number,
) {
  const totalMinutes = Math.floor(
    milliseconds / 60000,
  )

  const days = Math.floor(
    totalMinutes / (60 * 24),
  )

  const hours = Math.floor(
    (totalMinutes % (60 * 24)) / 60,
  )

  const minutes = totalMinutes % 60

  const plural = (
    value: number,
    singular: string,
    pluralWord: string,
  ) =>
    `${value} ${value === 1 ? singular : pluralWord}`

  if (days > 0) {
    return hours > 0
      ? `${plural(days, 'día', 'días')} y ${plural(hours, 'hora', 'horas')}`
      : plural(days, 'día', 'días')
  }

  if (hours > 0) {
    return plural(hours, 'hora', 'horas')
  }

  if (minutes > 1) {
    return plural(minutes, 'minuto', 'minutos')
  }

  return 'unos minutos'
}
