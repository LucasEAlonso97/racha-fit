import {
  Check,
  Clock3,
  Flame,
  ShieldCheck,
  Skull,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'

import {
  useGroupStreakHistory,
} from '../hooks/useGroupStreakHistory'

import type {
  GroupWeekHistory,
  GroupWeekMemberHistory,
} from '../hooks/useGroupStreakHistory'

type Props = {
  groupId: string
}

/*
 * ========================================
 * FECHAS
 * ========================================
 */

const monthNames = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

function parseDateKey(
  dateKey: string,
) {
  return new Date(
    `${dateKey}T12:00:00`,
  )
}

function addDays(
  dateKey: string,
  days: number,
) {
  const date =
    parseDateKey(
      dateKey,
    )

  date.setDate(
    date.getDate() +
      days,
  )

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function formatWeek(
  weekStart: string,
) {
  const start =
    parseDateKey(
      weekStart,
    )

  const end =
    parseDateKey(
      addDays(
        weekStart,
        6,
      ),
    )

  if (
    start.getMonth() ===
    end.getMonth()
  ) {
    return `${start.getDate()} - ${end.getDate()} ${
      monthNames[
        end.getMonth()
      ]
    }`
  }

  return `${start.getDate()} ${
    monthNames[
      start.getMonth()
    ]
  } - ${end.getDate()} ${
    monthNames[
      end.getMonth()
    ]
  }`
}

/*
 * ========================================
 * SALVADORES
 * ========================================
 *
 * La persona que llegó ÚLTIMA a su meta
 * fue quien terminó de asegurar
 * la semana para la banda.
 *
 * Si varias personas completaron
 * el mismo día, mostramos a todas.
 * ========================================
 */

function getWeekSaviors(
  week:
    GroupWeekHistory,
): GroupWeekMemberHistory[] {
  if (
    week.status !==
    'saved'
  ) {
    return []
  }

  const completedMembers =
    week.members.filter(
      member =>
        member.metGoal &&
        Boolean(
          member.completedOn,
        ),
    )

  if (
    completedMembers.length ===
    0
  ) {
    return []
  }

  const latestDate =
    completedMembers.reduce(
      (
        latest,
        member,
      ) => {
        if (
          !member.completedOn
        ) {
          return latest
        }

        if (
          !latest ||
          member.completedOn >
            latest
        ) {
          return member.completedOn
        }

        return latest
      },
      '',
    )

  return completedMembers.filter(
    member =>
      member.completedOn ===
      latestDate,
  )
}

/*
 * ========================================
 * TEXTO DE SALVADORES
 * ========================================
 */

function getSaviorNames(
  saviors:
    GroupWeekMemberHistory[],
) {
  if (
    saviors.length ===
    0
  ) {
    return ''
  }

  if (
    saviors.length ===
    1
  ) {
    return saviors[
      0
    ].name
  }

  if (
    saviors.length ===
    2
  ) {
    return `${saviors[0].name} y ${saviors[1].name}`
  }

  const firstNames =
    saviors
      .slice(
        0,
        -1,
      )
      .map(
        member =>
          member.name,
      )
      .join(', ')

  const lastName =
    saviors[
      saviors.length -
        1
    ].name

  return `${firstNames} y ${lastName}`
}

/*
 * ========================================
 * DÍA DE LA SEMANA
 * ========================================
 */

function getWeekDayIndex(
  weekStart: string,
  completedOn: string,
) {
  const start =
    parseDateKey(
      weekStart,
    )

  const completed =
    parseDateKey(
      completedOn,
    )

  return Math.round(
    (
      completed.getTime() -
      start.getTime()
    ) /
      86400000,
  )
}

function getEpicText(
  dayIndex: number,
) {
  if (
    dayIndex >=
    6
  ) {
    return 'La salvaron el domingo. Al límite 😮‍💨'
  }

  if (
    dayIndex ===
    5
  ) {
    return 'La salvaron el sábado. Casi sobre la hora.'
  }

  const remaining =
    Math.max(
      6 -
        dayIndex,
      0,
    )

  if (
    remaining ===
    1
  ) {
    return 'La banda cerró todo con 1 día de margen.'
  }

  return `La banda cerró todo con ${remaining} días de margen.`
}

/*
 * ========================================
 * COMPONENTE
 * ========================================
 */

function GroupHistoryPanel({
  groupId,
}: Props) {
  const {
    weeks,
    loading,
    error,
  } =
    useGroupStreakHistory(
      groupId,
    )

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (
    loading
  ) {
    return (
      <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-500">
          <Flame
            size={
              23
            }
          />
        </div>

        <p className="mt-4 font-black text-zinc-700">
          Cargando la historia de
          la banda...
        </p>
      </div>
    )
  }

  /*
   * ========================================
   * ERROR
   * ========================================
   */

  if (
    error
  ) {
    return (
      <div className="rounded-[28px] bg-red-50 p-5">
        <p className="font-black text-red-600">
          No pudimos cargar el
          historial.
        </p>

        <p className="mt-1 text-sm text-red-400">
          {
            error
          }
        </p>
      </div>
    )
  }

  /*
   * ========================================
   * SEMANAS
   * ========================================
   */

  const currentWeek =
    weeks.find(
      week =>
        week.status ===
        'open',
    )

  const finalizedWeeks =
    weeks.filter(
      week =>
        week.status !==
        'open',
    )

  const savedWeeks =
    finalizedWeeks.filter(
      week =>
        week.status ===
        'saved',
    )

  const failedWeeks =
    finalizedWeeks.filter(
      week =>
        week.status ===
        'failed',
    )

  /*
   * ========================================
   * ¿SEMANA ACTUAL ASEGURADA?
   * ========================================
   */

  const currentWeekSecured =
    Boolean(
      currentWeek &&
        currentWeek.members.length >
          0 &&
        currentWeek.members.every(
          member =>
            member.metGoal,
        ),
    )

  /*
   * ========================================
   * RACHA ACTUAL
   * ========================================
   */

  let historicalCurrentStreak =
    0

  for (
    const week of finalizedWeeks
  ) {
    if (
      week.status ===
      'saved'
    ) {
      historicalCurrentStreak +=
        1
    } else {
      break
    }
  }

  const currentStreak =
    historicalCurrentStreak +
    (
      currentWeekSecured
        ? 1
        : 0
    )

  /*
   * ========================================
   * MEJOR RACHA
   * ========================================
   */

  const chronologicalWeeks =
    [
      ...finalizedWeeks,
    ].reverse()

  let bestStreak =
    0

  let runningStreak =
    0

  for (
    const week of chronologicalWeeks
  ) {
    if (
      week.status ===
      'saved'
    ) {
      runningStreak +=
        1

      bestStreak =
        Math.max(
          bestStreak,
          runningStreak,
        )
    } else {
      runningStreak =
        0
    }
  }

  if (
    currentWeekSecured
  ) {
    bestStreak =
      Math.max(
        bestStreak,
        historicalCurrentStreak +
          1,
      )
  }

  /*
   * ========================================
   * ÚLTIMA SEMANA SALVADA
   * ========================================
   */

  const latestSavedWeek =
    savedWeeks[
      0
    ] ??
    null

  const latestSaviors =
    latestSavedWeek
      ? getWeekSaviors(
          latestSavedWeek,
        )
      : []

  const latestSaviorNames =
    getSaviorNames(
      latestSaviors,
    )

  /*
   * ========================================
   * SEMANA MÁS ÉPICA
   * ========================================
   */

  let epicWeek:
    | {
        week:
          GroupWeekHistory

        saviors:
          GroupWeekMemberHistory[]

        completedOn:
          string

        dayIndex:
          number
      }
    | null =
    null

  for (
    const week of savedWeeks
  ) {
    const saviors =
      getWeekSaviors(
        week,
      )

    const completedOn =
      saviors[
        0
      ]?.completedOn

    if (
      !completedOn
    ) {
      continue
    }

    const dayIndex =
      getWeekDayIndex(
        week.weekStart,
        completedOn,
      )

    if (
      !epicWeek ||
      dayIndex >
        epicWeek.dayIndex
    ) {
      epicWeek = {
        week,
        saviors,
        completedOn,
        dayIndex,
      }
    }
  }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <div className="space-y-5">
      {/* ================================= */}
      {/* RACHA PRINCIPAL */}
      {/* ================================= */}

      <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-orange-100 via-amber-50 to-violet-100 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-orange-500">
                RACHA DEL GRUPO
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/80 text-orange-500 shadow-sm">
                  <Flame
                    size={
                      29
                    }
                    className="fill-orange-400"
                  />
                </div>

                <div>
                  <p className="text-4xl font-black tracking-tight text-zinc-800">
                    {
                      currentStreak
                    }
                  </p>

                  <p className="text-sm font-black text-zinc-500">
                    {currentStreak ===
                    1
                      ? 'semana'
                      : 'semanas'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm">
              <p className="text-lg font-black text-violet-600">
                {
                  bestStreak
                }
              </p>

              <p className="text-[9px] font-black tracking-wide text-zinc-400">
                MEJOR
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white/60 px-4 py-3">
            {currentWeekSecured ? (
              <>
                <p className="font-black text-orange-600">
                  🔥 Esta semana ya
                  está asegurada.
                </p>

                <p className="mt-1 text-xs font-semibold text-orange-500">
                  Todos cumplieron su
                  parte.
                </p>
              </>
            ) : (
              <>
                <p className="font-black text-zinc-700">
                  Esta semana sigue en
                  juego.
                </p>

                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  Que no se corte.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ================================= */}
      {/* NÚMEROS */}
      {/* ================================= */}

      <section className="grid grid-cols-4 gap-2">
        <div className="rounded-[20px] bg-white p-3 text-center shadow-sm">
          <Flame
            size={
              18
            }
            className="mx-auto text-orange-500"
          />

          <p className="mt-2 text-lg font-black text-zinc-800">
            {
              currentStreak
            }
          </p>

          <p className="mt-0.5 text-[9px] font-black text-zinc-400">
            ACTUAL
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-3 text-center shadow-sm">
          <Trophy
            size={
              18
            }
            className="mx-auto text-yellow-500"
          />

          <p className="mt-2 text-lg font-black text-zinc-800">
            {
              bestStreak
            }
          </p>

          <p className="mt-0.5 text-[9px] font-black text-zinc-400">
            MEJOR
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-3 text-center shadow-sm">
          <Check
            size={
              18
            }
            className="mx-auto text-green-500"
          />

          <p className="mt-2 text-lg font-black text-zinc-800">
            {
              savedWeeks.length
            }
          </p>

          <p className="mt-0.5 text-[9px] font-black text-zinc-400">
            SALVADAS
          </p>
        </div>

        <div className="rounded-[20px] bg-white p-3 text-center shadow-sm">
          <Skull
            size={
              18
            }
            className="mx-auto text-zinc-400"
          />

          <p className="mt-2 text-lg font-black text-zinc-800">
            {
              failedWeeks.length
            }
          </p>

          <p className="mt-0.5 text-[9px] font-black text-zinc-400">
            CORTADAS
          </p>
        </div>
      </section>

      {/* ================================= */}
      {/* QUIÉN SALVÓ LA ÚLTIMA */}
      {/* ================================= */}

      {latestSavedWeek &&
        latestSaviors.length >
          0 && (
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-100 to-pink-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
              <ShieldCheck
                size={
                  24
                }
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black tracking-[0.12em] text-violet-500">
                SALVADOR DE LA BANDA
              </p>

              <p className="mt-2 text-xl font-black text-zinc-800">
                {
                  latestSaviorNames
                }{' '}
                🔥
              </p>

              <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                {latestSaviors.length ===
                1
                  ? 'Fue quien completó último su meta y terminó de salvar la semana.'
                  : 'Fueron quienes completaron su meta el último día y cerraron la semana.'}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-violet-500">
                <Clock3
                  size={
                    14
                  }
                />

                {formatWeek(
                  latestSavedWeek.weekStart,
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================================= */}
      {/* ÚLTIMAS SEMANAS */}
      {/* ================================= */}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-black tracking-[0.12em] text-zinc-400">
            ÚLTIMAS SEMANAS
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-500">
            La historia de cómo viene
            la banda.
          </p>
        </div>

        {weeks.length >
        0 ? (
          <div className="space-y-3">
            {weeks
              .slice(
                0,
                12,
              )
              .map(
                week => {
                  const saviors =
                    getWeekSaviors(
                      week,
                    )

                  const saviorNames =
                    getSaviorNames(
                      saviors,
                    )

                  const completed =
                    week.members.filter(
                      member =>
                        member.metGoal,
                    ).length

                  const total =
                    week.members.length

                  return (
                    <div
                      key={
                        week.id
                      }
                      className={`rounded-[20px] border p-4 ${
                        week.status ===
                        'saved'
                          ? 'border-green-100 bg-green-50/60'
                          : week.status ===
                              'failed'
                            ? 'border-zinc-200 bg-zinc-50'
                            : 'border-violet-100 bg-violet-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-zinc-800">
                            {formatWeek(
                              week.weekStart,
                            )}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                            <Users
                              size={
                                13
                              }
                            />

                            {
                              completed
                            }
                            /
                            {
                              total
                            }{' '}
                            cumplieron
                          </div>
                        </div>

                        {week.status ===
                        'saved' ? (
                          <span className="rounded-full bg-green-100 px-3 py-1.5 text-[10px] font-black text-green-600">
                            SALVADA
                          </span>
                        ) : week.status ===
                          'failed' ? (
                          <span className="rounded-full bg-zinc-200 px-3 py-1.5 text-[10px] font-black text-zinc-500">
                            CORTADA
                          </span>
                        ) : currentWeekSecured ? (
                          <span className="rounded-full bg-orange-100 px-3 py-1.5 text-[10px] font-black text-orange-600">
                            ASEGURADA
                          </span>
                        ) : (
                          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-black text-violet-600">
                            EN JUEGO
                          </span>
                        )}
                      </div>

                      {/* SALVADOR SEMANAL */}

                      {week.status ===
                        'saved' &&
                        saviors.length >
                          0 && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                            <ShieldCheck
                              size={
                                15
                              }
                              className="shrink-0 text-violet-500"
                            />

                            <p className="text-xs font-semibold text-zinc-500">
                              <span className="font-black text-violet-600">
                                {
                                  saviorNames
                                }
                              </span>{' '}
                              {saviors.length ===
                              1
                                ? 'salvó la semana'
                                : 'salvaron la semana'}{' '}
                              🔥
                            </p>
                          </div>
                        )}
                    </div>
                  )
                },
              )}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50 px-4 py-7 text-center">
            <Flame
              size={
                23
              }
              className="mx-auto text-zinc-300"
            />

            <p className="mt-3 font-black text-zinc-600">
              La historia recién
              empieza
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Cuando termine la
              primera semana va a
              aparecer acá.
            </p>
          </div>
        )}
      </section>

      {/* ================================= */}
      {/* SEMANA MÁS ÉPICA */}
      {/* ================================= */}

      {epicWeek && (
        <section className="rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
              <Sparkles
                size={
                  21
                }
              />
            </div>

            <div>
              <p className="text-xs font-black tracking-[0.12em] text-zinc-400">
                SEMANA MÁS ÉPICA
              </p>

              <p className="mt-2 font-black text-zinc-800">
                {formatWeek(
                  epicWeek.week.weekStart,
                )}
              </p>

              <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                {getEpicText(
                  epicWeek.dayIndex,
                )}
              </p>

              <p className="mt-2 text-xs font-black text-violet-500">
                {getSaviorNames(
                  epicWeek.saviors,
                )}{' '}
                {epicWeek.saviors.length ===
                1
                  ? 'la cerró 🔥'
                  : 'la cerraron 🔥'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default GroupHistoryPanel