import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ArrowRight,
  Gift,
  History,
  RefreshCw,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'

import UserAvatar from '../components/UserAvatar'

import {
  useTournament,
} from '../hooks/useTournament'

import {
  supabase,
} from '../lib/supabase'

import type {
  Group,
  User,
} from '../types'

/*
 * ========================================
 * TYPES
 * ========================================
 */

type Props = {
  group: Group
  users: User[]
  currentUserId: string
}

type HistoryParticipant = {
  user_id: string
  name: string
  team_number: number | null
  score: number
  weekly_goal_at_start?: number
}

type HistoryChallenge = {
  id: string
  name: string
  emoji: string
  description: string
  scoring_type: string
}

type HistoryPrize = {
  id: string
  title: string
  emoji: string
  description: string
  category: string
}

type TournamentHistoryItem = {
  id: string
  group_id: string
  selector_user_id: string
  selected_card: number | null

  mode:
    | 'free_for_all'
    | 'two_vs_two'
    | null

  starts_on: string | null
  ends_on: string | null
  finished_at: string | null

  winner_user_id: string | null

  challenge: HistoryChallenge | null
  prize: HistoryPrize | null

  participants: HistoryParticipant[]
}

/*
 * ========================================
 * FECHA
 * ========================================
 */

function formatDate(
  date: string | null,
) {
  if (!date) {
    return ''
  }

  const [
    year,
    month,
    day,
  ] = date.split('-')

  return `${day}/${month}/${year}`
}

/*
 * ========================================
 * POSICIÓN
 * ========================================
 */

function getPositionLabel(
  position: number,
) {
  if (position === 0) {
    return '🥇'
  }

  if (position === 1) {
    return '🥈'
  }

  if (position === 2) {
    return '🥉'
  }

  return `${position + 1}°`
}

/*
 * ========================================
 * POSICIÓN CON EMPATES
 * ========================================
 */

function getRankingPosition(
  ranking: {
    score: number
  }[],
  index: number,
) {
  const currentScore =
    ranking[index]?.score

  if (
    currentScore ===
    undefined
  ) {
    return index
  }

  const higherScores =
    new Set(
      ranking
        .slice(
          0,
          index,
        )
        .filter(
          participant =>
            participant.score >
            currentScore,
        )
        .map(
          participant =>
            participant.score,
        ),
    )

  return higherScores.size
}

/*
 * ========================================
 * REGLAS DE PUNTAJE
 * ========================================
 */

function getScoringRules(
  scoringType: string,
) {
  switch (scoringType) {
    case 'active_days':
      return [
        '+1 punto por cada día con actividad.',
        'Varias actividades el mismo día cuentan como un solo día.',
      ]

    case 'three_day_streak':
      return [
        '+1 punto por cada día con actividad.',
        '+3 puntos extra si completás 3 días consecutivos.',
      ]

    case 'activity_variety':
      return [
        '+1 punto por cada día con actividad.',
        '+1 por cada tipo de actividad diferente después del primero.',
        'El bonus de variedad tiene un máximo de +3 puntos.',
      ]

    case 'weekend_double':
      return [
        'Lunes a viernes: +1 punto por día activo.',
        'Sábado y domingo: +2 puntos por día activo.',
      ]

    case 'weekly_goal':
      return [
        '+1 punto por cada día con actividad.',
        '+3 puntos cuando alcanzás tu meta semanal.',
        'La meta queda congelada cuando empieza el torneo.',
      ]

    default:
      return [
        '+1 punto por cada día con actividad.',
      ]
  }
}

/*
 * ========================================
 * HISTORIAL
 * ========================================
 */

function TournamentHistory({
  history,
  loading,
}: {
  history: TournamentHistoryItem[]
  loading: boolean
}) {
  return (
    <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <History size={21} />
        </div>

        <div>
          <p className="text-[10px] font-black tracking-wider text-violet-500">
            HISTORIAL
          </p>

          <h3 className="text-lg font-black text-zinc-800">
            Torneos anteriores
          </h3>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-5 text-center">
          <p className="text-xs font-bold text-zinc-400">
            Cargando historial...
          </p>
        </div>
      ) : history.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-5 text-center">
          <p className="text-2xl">
            🏆
          </p>

          <p className="mt-2 text-sm font-black text-zinc-600">
            Todavía no hay torneos terminados
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-400">
            Cuando termine el primero,
            va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map(
            item => {
              const ranking = [
                ...item.participants,
              ].sort(
                (
                  a,
                  b,
                ) => {
                  if (
                    b.score !==
                    a.score
                  ) {
                    return (
                      b.score -
                      a.score
                    )
                  }

                  return (
                    a.name.localeCompare(
                      b.name,
                    )
                  )
                },
              )

              const teamOne =
                ranking.filter(
                  participant =>
                    participant.team_number ===
                    1,
                )

              const teamTwo =
                ranking.filter(
                  participant =>
                    participant.team_number ===
                    2,
                )

              const teamOneScore =
                teamOne.reduce(
                  (
                    total,
                    participant,
                  ) =>
                    total +
                    participant.score,
                  0,
                )

              const teamTwoScore =
                teamTwo.reduce(
                  (
                    total,
                    participant,
                  ) =>
                    total +
                    participant.score,
                  0,
                )

              let resultTitle =
                'Sin resultado'

              let resultSubtitle =
                ''

              let resultEmoji =
                '🏆'

              /*
               * ============================
               * 2 VS 2
               * ============================
               */

              if (
                item.mode ===
                'two_vs_two'
              ) {
                if (
                  teamOneScore ===
                  teamTwoScore
                ) {
                  resultTitle =
                    'Empate entre equipos'

                  resultSubtitle =
                    `${teamOneScore} pts por equipo`

                  resultEmoji =
                    '🤝'
                } else {
                  const winningTeam =
                    teamOneScore >
                    teamTwoScore
                      ? teamOne
                      : teamTwo

                  const winningScore =
                    Math.max(
                      teamOneScore,
                      teamTwoScore,
                    )

                  const winnerNames =
                    winningTeam
                      .map(
                        participant =>
                          participant.name,
                      )
                      .join(' + ')

                  resultTitle =
                    winnerNames ||
                    'Equipo campeón'

                  resultSubtitle =
                    `${winningScore} pts`

                  resultEmoji =
                    '🏆'
                }
              }

              /*
               * ============================
               * TODOS VS TODOS
               * ============================
               */

              if (
                item.mode ===
                'free_for_all'
              ) {
                const topScore =
                  ranking[0]?.score ??
                  0

                const leaders =
                  ranking.filter(
                    participant =>
                      participant.score ===
                      topScore,
                  )

                if (
                  leaders.length >
                  1
                ) {
                  resultTitle =
                    `Empate: ${leaders
                      .map(
                        participant =>
                          participant.name,
                      )
                      .join(' · ')}`

                  resultSubtitle =
                    `${topScore} pts`

                  resultEmoji =
                    '🤝'
                } else if (
                  leaders.length ===
                  1
                ) {
                  resultTitle =
                    leaders[0].name

                  resultSubtitle =
                    `${topScore} pts`

                  resultEmoji =
                    '🏆'
                }
              }

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[24px] border border-zinc-100 bg-zinc-50"
                >
                  {/* ======================= */}
                  {/* TORNEO */}
                  {/* ======================= */}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                          {item.mode ===
                          'two_vs_two'
                            ? '2 VS 2'
                            : 'TODOS VS TODOS'}
                        </p>

                        <h4 className="mt-1 truncate text-base font-black text-zinc-800">
                          {item.challenge
                            ? `${item.challenge.emoji} ${item.challenge.name}`
                            : '🏆 Torneo'}
                        </h4>
                      </div>

                      {item.selected_card && (
                        <div className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black text-violet-600">
                          Carta #
                          {
                            item.selected_card
                          }
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-zinc-400">
                      {formatDate(
                        item.starts_on,
                      )}{' '}
                      →{' '}
                      {formatDate(
                        item.ends_on,
                      )}
                    </p>

                    {/* ===================== */}
                    {/* RESULTADO */}
                    {/* ===================== */}

                    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                      <div className="text-2xl">
                        {resultEmoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-zinc-700">
                          {resultTitle}
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-zinc-400">
                          {resultSubtitle}
                        </p>
                      </div>
                    </div>

                    {/* ===================== */}
                    {/* PREMIO */}
                    {/* ===================== */}

                    {item.prize && (
                      <div className="mt-3 flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3">
                        <span className="text-xl">
                          {
                            item.prize
                              .emoji
                          }
                        </span>

                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">
                            Premio
                          </p>

                          <p className="mt-0.5 text-xs font-black text-zinc-700">
                            {
                              item.prize
                                .title
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}

/*
 * ========================================
 * TORNEOS
 * ========================================
 */

function Torneos({
  group,
  users,
  currentUserId,
}: Props) {
  const {
    tournament,
    loading,
    error,
    choosingCard,
    continuing,
    chooseCard,
    continueTournament,
    refresh,
  } = useTournament(
    group.id,
  )

  /*
   * ========================================
   * HISTORIAL STATE
   * ========================================
   */

  const [
    history,
    setHistory,
  ] =
    useState<
      TournamentHistoryItem[]
    >([])

  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(true)

  /*
   * ========================================
   * CARGAR HISTORIAL
   * ========================================
   */

  const loadHistory =
    useCallback(
      async () => {
        if (!group.id) {
          return
        }

        setHistoryLoading(
          true,
        )

        const {
          data,
          error:
            historyError,
        } =
          await supabase.rpc(
            'get_tournament_history',
            {
              p_group_id:
                group.id,

              p_limit:
                10,
            },
          )

        if (
          historyError
        ) {
          console.error(
            'Error cargando historial de torneos:',
            historyError,
          )

          setHistoryLoading(
            false,
          )

          return
        }

        if (
          Array.isArray(
            data,
          )
        ) {
          setHistory(
            data as TournamentHistoryItem[],
          )
        } else {
          setHistory([])
        }

        setHistoryLoading(
          false,
        )
      },
      [
        group.id,
      ],
    )

  /*
   * El historial se vuelve
   * a consultar cuando cambia
   * el torneo actual.
   */

  useEffect(() => {
    void loadHistory()
  }, [
    loadHistory,
    tournament?.id,
    tournament?.status,
  ])

  /*
   * ========================================
   * SELECTORES
   * ========================================
   */

  const selector =
    tournament
      ? users.find(
          user =>
            user.id ===
            tournament.selector_user_id,
        ) ?? null
      : null

  const nextSelector =
    tournament
      ? users.find(
          user =>
            user.id ===
            tournament.next_selector_user_id,
        ) ?? null
      : null

  const isMyTurn =
    tournament?.status ===
      'waiting_selection' &&
    tournament.selector_user_id ===
      currentUserId

  const isMyNextTurn =
    tournament?.status ===
      'finished' &&
    tournament.next_selector_user_id ===
      currentUserId

  /*
   * ========================================
   * LOADING
   * ========================================
   */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <Trophy
              size={28}
            />
          </div>

          <p className="mt-4 text-sm font-black text-zinc-700">
            Preparando el torneo...
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-400">
            Barajando las cartas 👀
          </p>
        </div>
      </div>
    )
  }

  /*
   * ========================================
   * ERROR SIN TORNEO
   * ========================================
   */

  if (
    error &&
    !tournament
  ) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <div className="rounded-[28px] bg-white p-6 text-center shadow-sm">
          <p className="text-4xl">
            😵
          </p>

          <h1 className="mt-4 text-xl font-black text-zinc-800">
            No pudimos cargar Torneos
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void refresh()
            }
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-black text-white"
          >
            <RefreshCw
              size={16}
            />

            Reintentar
          </button>
        </div>
      </div>
    )
  }

  /*
   * ========================================
   * SIN TORNEO
   * ========================================
   */

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
        />
      </div>
    )
  }

  /*
   * ========================================
   * RANKING
   * ========================================
   */

  const ranking = [
    ...tournament.participants,
  ].sort(
    (
      a,
      b,
    ) => {
      if (
        b.score !==
        a.score
      ) {
        return (
          b.score -
          a.score
        )
      }

      return a.name.localeCompare(
        b.name,
      )
    },
  )

  /*
   * ========================================
   * EQUIPOS
   * ========================================
   */

  const teamOne =
    ranking.filter(
      participant =>
        participant.team_number ===
        1,
    )

  const teamTwo =
    ranking.filter(
      participant =>
        participant.team_number ===
        2,
    )

  const teamOneScore =
    teamOne.reduce(
      (
        total,
        participant,
      ) =>
        total +
        participant.score,
      0,
    )

  const teamTwoScore =
    teamTwo.reduce(
      (
        total,
        participant,
      ) =>
        total +
        participant.score,
      0,
    )

  /*
   * ========================================
   * TERMINADO
   * ========================================
   */

  if (
    tournament.status ===
    'finished'
  ) {
    const topScore =
      ranking[0]?.score ??
      0

    const leaders =
      ranking.filter(
        participant =>
          participant.score ===
          topScore,
      )

    const freeForAllTie =
      tournament.mode ===
        'free_for_all' &&
      leaders.length > 1

    const teamTie =
      tournament.mode ===
        'two_vs_two' &&
      teamOneScore ===
        teamTwoScore

    const isTie =
      freeForAllTie ||
      teamTie

    const winner =
      tournament.winner_user_id
        ? users.find(
            user =>
              user.id ===
              tournament.winner_user_id,
          ) ?? null
        : null

    const winningTeamNumber =
      tournament.mode ===
        'two_vs_two' &&
      !teamTie
        ? teamOneScore >
          teamTwoScore
          ? 1
          : 2
        : null

    const winningTeam =
      winningTeamNumber === 1
        ? teamOne
        : winningTeamNumber === 2
          ? teamTwo
          : []

    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="mb-6">
          <p className="text-xs font-black tracking-[0.15em] text-amber-500">
            RESULTADO FINAL
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Trophy
                size={27}
              />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-800">
                Torneo terminado
              </h1>

              <p className="text-sm font-semibold text-zinc-500">
                Ya tenemos resultado.
              </p>
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* GANADOR / EMPATE */}
        {/* ================================= */}

        <section className="overflow-hidden rounded-[30px] bg-zinc-900 p-6 text-center shadow-lg">
          {isTie ? (
            <>
              <div className="text-5xl">
                🤝
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-violet-300">
                EMPATE
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Quedó todo igualado
              </h2>

              {tournament.mode ===
              'free_for_all' ? (
                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {leaders
                    .map(
                      leader =>
                        leader.name,
                    )
                    .join(
                      ' · ',
                    )}{' '}
                  terminaron con{' '}
                  <span className="font-black text-white">
                    {topScore}{' '}
                    pts
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  Los dos equipos
                  terminaron con{' '}
                  <span className="font-black text-white">
                    {
                      teamOneScore
                    }{' '}
                    pts
                  </span>
                </p>
              )}
            </>
          ) : tournament.mode ===
            'two_vs_two' ? (
            <>
              <div className="text-5xl">
                🏆
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-amber-300">
                CAMPEONES
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Equipo{' '}
                {
                  winningTeamNumber
                }
              </h2>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {winningTeam.map(
                  participant => {
                    const user =
                      users.find(
                        item =>
                          item.id ===
                          participant.user_id,
                      )

                    if (!user) {
                      return null
                    }

                    return (
                      <div
                        key={
                          participant.user_id
                        }
                        className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"
                      >
                        <UserAvatar
                          user={
                            user
                          }
                          size="sm"
                        />

                        <span className="text-xs font-black text-white">
                          {
                            user.name
                          }
                        </span>
                      </div>
                    )
                  },
                )}
              </div>

              <p className="mt-4 text-3xl font-black text-white">
                {winningTeamNumber ===
                1
                  ? teamOneScore
                  : teamTwoScore}{' '}
                pts
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl">
                🏆
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-amber-300">
                CAMPEÓN
              </p>

              {winner && (
                <div className="mt-4 flex justify-center">
                  <UserAvatar
                    user={winner}
                    size="lg"
                  />
                </div>
              )}

              <h2 className="mt-3 text-2xl font-black text-white">
                {winner?.name ??
                  ranking[0]
                    ?.name ??
                  'Ganador'}
              </h2>

              <p className="mt-2 text-3xl font-black text-amber-300">
                {topScore}{' '}
                pts
              </p>
            </>
          )}

          {tournament.challenge && (
            <div className="mt-6 rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                TORNEO
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {
                  tournament
                    .challenge
                    .emoji
                }{' '}
                {
                  tournament
                    .challenge
                    .name
                }
              </p>
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* PREMIO */}
        {/* ================================= */}

        {tournament.prize && (
          <section className="mt-5 rounded-[28px] bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                {
                  tournament
                    .prize
                    .emoji
                }
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Gift
                    size={14}
                    className="text-amber-600"
                  />

                  <p className="text-[10px] font-black tracking-wider text-amber-600">
                    PREMIO
                  </p>
                </div>

                <h3 className="mt-1 text-lg font-black text-zinc-800">
                  {
                    tournament
                      .prize
                      .title
                  }
                </h3>

                {isTie ? (
                  tournament.mode ===
                  'two_vs_two' ? (
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                      Como hubo
                      empate entre
                      equipos, esta
                      vez el premio
                      queda vacante
                      🤝
                    </p>
                  ) : (
                    <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                      Hubo empate en
                      el primer
                      puesto. Los
                      campeones
                      comparten el
                      premio 🤝
                    </p>
                  )
                ) : (
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                    {
                      tournament
                        .prize
                        .description
                    }
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* TABLA FINAL */}
        {/* ================================= */}

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy
              size={19}
              className="text-violet-500"
            />

            <div>
              <p className="text-[10px] font-black tracking-wider text-zinc-400">
                RESULTADOS
              </p>

              <h3 className="text-lg font-black text-zinc-800">
                Tabla final
              </h3>
            </div>
          </div>

          {tournament.mode ===
          'two_vs_two' ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-violet-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-violet-700">
                    Equipo 1
                  </p>

                  <p className="text-lg font-black text-violet-700">
                    {
                      teamOneScore
                    }{' '}
                    pts
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {teamOne.map(
                    participant => (
                      <div
                        key={
                          participant.user_id
                        }
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-zinc-600">
                          {
                            participant.name
                          }
                        </span>

                        <span className="font-black text-zinc-700">
                          {
                            participant.score
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-orange-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-orange-600">
                    Equipo 2
                  </p>

                  <p className="text-lg font-black text-orange-600">
                    {
                      teamTwoScore
                    }{' '}
                    pts
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {teamTwo.map(
                    participant => (
                      <div
                        key={
                          participant.user_id
                        }
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-zinc-600">
                          {
                            participant.name
                          }
                        </span>

                        <span className="font-black text-zinc-700">
                          {
                            participant.score
                          }
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {ranking.map(
                (
                  participant,
                  index,
                ) => {
                  const user =
                    users.find(
                      item =>
                        item.id ===
                        participant.user_id,
                    )

                  if (!user) {
                    return null
                  }

                  const position =
                    getRankingPosition(
                      ranking,
                      index,
                    )

                  return (
                    <div
                      key={
                        participant.user_id
                      }
                      className="flex items-center justify-between rounded-2xl bg-zinc-50 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex w-7 shrink-0 justify-center text-base font-black">
                          {getPositionLabel(
                            position,
                          )}
                        </div>

                        <UserAvatar
                          user={
                            user
                          }
                          size="sm"
                        />

                        <p className="truncate text-sm font-black text-zinc-700">
                          {
                            user.name
                          }
                        </p>
                      </div>

                      <p className="ml-3 text-sm font-black text-zinc-800">
                        {
                          participant.score
                        }{' '}
                        pts
                      </p>
                    </div>
                  )
                },
              )}
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* PRÓXIMO TURNO */}
        {/* ================================= */}

        {nextSelector && (
          <section className="mt-5 rounded-[28px] bg-gradient-to-br from-violet-100 via-violet-50 to-pink-50 p-5 shadow-sm">
            <p className="text-xs font-black tracking-wider text-violet-500">
              PRÓXIMO TORNEO
            </p>

            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                user={
                  nextSelector
                }
                size="lg"
              />

              <div className="min-w-0">
                <p className="text-base font-black text-zinc-800">
                  {isMyNextTurn
                    ? 'Ahora te toca a vos 😈'
                    : `Le toca a ${nextSelector.name}`}
                </p>

                <p className="mt-1 text-xs font-semibold text-zinc-500">
                  {
                    nextSelector.name
                  }{' '}
                  va a elegir la
                  próxima carta.
                </p>
              </div>
            </div>

            {isMyNextTurn ? (
              <button
                type="button"
                disabled={
                  continuing
                }
                onClick={() =>
                  void continueTournament()
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {continuing
                  ? 'Preparando...'
                  : 'Preparar próximo torneo'}

                {!continuing && (
                  <ArrowRight
                    size={17}
                  />
                )}
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-center">
                <p className="text-xs font-bold text-zinc-500">
                  Esperando a{' '}
                  <span className="font-black text-zinc-700">
                    {
                      nextSelector.name
                    }
                  </span>
                  .
                </p>
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="mt-4 text-center text-xs font-bold text-red-500">
            {error}
          </p>
        )}

        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
        />
      </div>
    )
  }

  /*
   * ========================================
   * TORNEO ACTIVO
   * ========================================
   */

  if (
    tournament.status ===
      'active' &&
    tournament.challenge &&
    tournament.prize
  ) {
    const teamOneWinning =
      teamOneScore >
      teamTwoScore

    const teamTwoWinning =
      teamTwoScore >
      teamOneScore

    const teamsTied =
      teamOneScore ===
      teamTwoScore

    const topScore =
      ranking[0]?.score ??
      0

    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <header className="mb-6">
          <p className="text-xs font-black tracking-[0.15em] text-violet-500">
            TORNEO EN JUEGO
          </p>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
              <Trophy
                size={26}
              />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-800">
                Torneos
              </h1>

              <p className="text-sm font-semibold text-zinc-500">
                Ahora sí. A competir.
              </p>
            </div>
          </div>
        </header>

        {/* ================================= */}
        {/* DESAFÍO */}
        {/* ================================= */}

        <section className="overflow-hidden rounded-[30px] bg-zinc-900 shadow-lg">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-violet-300">
                  DESAFÍO REVELADO
                </p>

                <div className="mt-3 text-5xl">
                  {
                    tournament
                      .challenge
                      .emoji
                  }
                </div>
              </div>

              <div className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">
                {tournament.mode ===
                'two_vs_two'
                  ? '2 VS 2'
                  : 'TODOS VS TODOS'}
              </div>
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              {
                tournament
                  .challenge
                  .name
              }
            </h2>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-300">
              {
                tournament
                  .challenge
                  .description
              }
            </p>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Empieza
                </p>

                <p className="mt-1 text-xs font-black text-white">
                  {formatDate(
                    tournament.starts_on,
                  )}
                </p>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Termina
                </p>

                <p className="mt-1 text-xs font-black text-white">
                  {formatDate(
                    tournament.ends_on,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* REGLAS */}
        {/* ================================= */}

        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-xl">
              🎯
            </div>

            <div>
              <p className="text-[10px] font-black tracking-wider text-violet-500">
                CÓMO SUMÁS PUNTOS
              </p>

              <h3 className="text-lg font-black text-zinc-800">
                Reglas del torneo
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {getScoringRules(
              tournament.challenge
                .scoring_type,
            ).map(
              rule => (
                <div
                  key={rule}
                  className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3"
                >
                  <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-500" />

                  <p className="text-sm font-semibold leading-relaxed text-zinc-600">
                    {rule}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold leading-relaxed text-amber-700">
              🃏 Los días
              recuperados con
              comodín no suman
              puntos en Torneos.
            </p>
          </div>
        </section>

        {/* ================================= */}
        {/* PREMIO */}
        {/* ================================= */}

        <section className="mt-5 rounded-[28px] bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              {
                tournament
                  .prize
                  .emoji
              }
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Gift
                  size={14}
                  className="text-amber-600"
                />

                <p className="text-[10px] font-black tracking-wider text-amber-600">
                  PREMIO
                </p>
              </div>

              <h3 className="mt-1 text-lg font-black text-zinc-800">
                {
                  tournament
                    .prize
                    .title
                }
              </h3>

              <p className="mt-1 text-sm font-semibold leading-relaxed text-zinc-500">
                {
                  tournament
                    .prize
                    .description
                }
              </p>
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* CLASIFICACIÓN */}
        {/* ================================= */}

        {tournament.mode ===
        'two_vs_two' ? (
          <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Swords
                size={20}
                className="text-violet-500"
              />

              <div>
                <p className="text-[10px] font-black tracking-wider text-zinc-400">
                  CLASIFICACIÓN
                </p>

                <h3 className="text-lg font-black text-zinc-800">
                  Batalla por
                  equipos
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* EQUIPO 1 */}

              <div
                className={`rounded-[24px] border p-4 ${
                  teamOneWinning
                    ? 'border-violet-200 bg-violet-50'
                    : 'border-zinc-100 bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-zinc-800">
                      {teamOneWinning
                        ? '👑 '
                        : ''}
                      Equipo 1
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      {teamOneWinning
                        ? 'VA GANANDO'
                        : teamsTied
                          ? 'EMPATE'
                          : 'EN JUEGO'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-violet-600">
                      {
                        teamOneScore
                      }
                    </p>

                    <p className="text-[9px] font-black uppercase text-zinc-400">
                      pts
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {teamOne.map(
                    participant => {
                      const user =
                        users.find(
                          item =>
                            item.id ===
                            participant.user_id,
                        )

                      if (!user) {
                        return null
                      }

                      return (
                        <div
                          key={
                            participant.user_id
                          }
                          className="flex items-center justify-between rounded-2xl bg-white px-3 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={
                                user
                              }
                              size="sm"
                            />

                            <div>
                              <p className="text-sm font-black text-zinc-700">
                                {
                                  user.name
                                }
                              </p>

                              {user.id ===
                                currentUserId && (
                                <p className="text-[9px] font-black text-violet-500">
                                  VOS
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm font-black text-zinc-800">
                            {
                              participant.score
                            }{' '}
                            pts
                          </p>
                        </div>
                      )
                    },
                  )}
                </div>
              </div>

              <div className="text-center text-xs font-black text-zinc-300">
                VS
              </div>

              {/* EQUIPO 2 */}

              <div
                className={`rounded-[24px] border p-4 ${
                  teamTwoWinning
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-zinc-100 bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-zinc-800">
                      {teamTwoWinning
                        ? '👑 '
                        : ''}
                      Equipo 2
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      {teamTwoWinning
                        ? 'VA GANANDO'
                        : teamsTied
                          ? 'EMPATE'
                          : 'EN JUEGO'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-orange-500">
                      {
                        teamTwoScore
                      }
                    </p>

                    <p className="text-[9px] font-black uppercase text-zinc-400">
                      pts
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {teamTwo.map(
                    participant => {
                      const user =
                        users.find(
                          item =>
                            item.id ===
                            participant.user_id,
                        )

                      if (!user) {
                        return null
                      }

                      return (
                        <div
                          key={
                            participant.user_id
                          }
                          className="flex items-center justify-between rounded-2xl bg-white px-3 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              user={
                                user
                              }
                              size="sm"
                            />

                            <div>
                              <p className="text-sm font-black text-zinc-700">
                                {
                                  user.name
                                }
                              </p>

                              {user.id ===
                                currentUserId && (
                                <p className="text-[9px] font-black text-violet-500">
                                  VOS
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-sm font-black text-zinc-800">
                            {
                              participant.score
                            }{' '}
                            pts
                          </p>
                        </div>
                      )
                    },
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users
                size={20}
                className="text-violet-500"
              />

              <div>
                <p className="text-[10px] font-black tracking-wider text-zinc-400">
                  CLASIFICACIÓN
                </p>

                <h3 className="text-lg font-black text-zinc-800">
                  Todos contra
                  todos
                </h3>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {ranking.map(
                (
                  participant,
                  index,
                ) => {
                  const user =
                    users.find(
                      item =>
                        item.id ===
                        participant.user_id,
                    )

                  if (!user) {
                    return null
                  }

                  const position =
                    getRankingPosition(
                      ranking,
                      index,
                    )

                  const isLeader =
                    participant.score ===
                    topScore

                  return (
                    <div
                      key={
                        participant.user_id
                      }
                      className={`flex items-center justify-between rounded-2xl px-3 py-3 ${
                        isLeader
                          ? 'bg-amber-50'
                          : 'bg-zinc-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex w-8 shrink-0 items-center justify-center text-lg font-black">
                          {getPositionLabel(
                            position,
                          )}
                        </div>

                        <UserAvatar
                          user={
                            user
                          }
                          size="sm"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-700">
                            {
                              user.name
                            }
                          </p>

                          {user.id ===
                            currentUserId && (
                            <p className="text-[9px] font-black text-violet-500">
                              VOS
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-lg font-black text-zinc-800">
                          {
                            participant.score
                          }
                        </p>

                        <p className="text-[9px] font-black uppercase text-zinc-400">
                          pts
                        </p>
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* INFO */}
        {/* ================================= */}

        <section className="mt-4 rounded-2xl bg-violet-50 px-4 py-3">
          <p className="text-xs font-semibold leading-relaxed text-violet-700">
            Los puntos se
            actualizan
            automáticamente con
            las actividades
            registradas durante
            el torneo.
          </p>
        </section>

        <p className="mt-5 text-center text-xs font-semibold text-zinc-400">
          Carta elegida{' '}
          <span className="font-black text-violet-500">
            #
            {
              tournament.selected_card
            }
          </span>
        </p>

        {error && (
          <p className="mt-3 text-center text-xs font-bold text-red-500">
            {error}
          </p>
        )}

        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
        />
      </div>
    )
  }

  /*
   * ========================================
   * ESPERANDO ELECCIÓN
   * ========================================
   */

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <header className="mb-6">
        <p className="text-xs font-black tracking-[0.15em] text-violet-500">
          COMPETÍ CON TU BANDA
        </p>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
            <Trophy
              size={26}
            />
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-800">
              Torneos
            </h1>

            <p className="text-sm font-semibold text-zinc-500">
              Acá sí hay algo en
              juego.
            </p>
          </div>
        </div>
      </header>

      {/* ================================= */}
      {/* TURNO */}
      {/* ================================= */}

      <section className="mb-5 rounded-[28px] bg-gradient-to-br from-violet-100 via-violet-50 to-pink-50 p-5 shadow-sm">
        <p className="text-xs font-black tracking-wider text-violet-500">
          ¿QUIÉN ELIGE?
        </p>

        {selector && (
          <div className="mt-4 flex items-center gap-3">
            <UserAvatar
              user={selector}
              size="lg"
            />

            <div className="min-w-0">
              <p className="text-base font-black text-zinc-800">
                {isMyTurn
                  ? 'Te toca a vos 😈'
                  : `Le toca a ${selector.name}`}
              </p>

              <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
                El turno rota entre
                todos los
                integrantes.
                Cuando termina la
                ronda, vuelve a
                empezar.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ================================= */}
      {/* CARTAS */}
      {/* ================================= */}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-wider text-zinc-400">
              ELEGÍ UNA CARTA
            </p>

            <h2 className="mt-1 text-xl font-black text-zinc-800">
              Nadie sabe qué hay
              atrás 👀
            </h2>
          </div>

          <Sparkles
            size={22}
            className="shrink-0 text-violet-500"
          />
        </div>

        <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-500">
          Desafío, modalidad y
          premio se revelan juntos.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[1, 2, 3].map(
            card => {
              const isChoosing =
                choosingCard ===
                card

              const anotherCardChoosing =
                choosingCard !==
                  null &&
                !isChoosing

              return (
                <button
                  key={card}
                  type="button"
                  disabled={
                    !isMyTurn ||
                    choosingCard !==
                      null
                  }
                  onClick={() =>
                    void chooseCard(
                      card,
                    )
                  }
                  className={`aspect-[3/4] transition-all duration-500 ${
                    anotherCardChoosing
                      ? 'scale-95 opacity-30'
                      : ''
                  } ${
                    isMyTurn &&
                    !choosingCard
                      ? 'hover:-translate-y-1 active:scale-95'
                      : ''
                  }`}
                  style={{
                    perspective:
                      '1000px',
                  }}
                >
                  <div
                    className="relative h-full w-full transition-transform duration-700"
                    style={{
                      transformStyle:
                        'preserve-3d',

                      transform:
                        isChoosing
                          ? 'rotateY(180deg)'
                          : 'rotateY(0deg)',
                    }}
                  >
                    {/* DORSO */}

                    <div
                      className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 p-2 text-white shadow-lg shadow-violet-100"
                      style={{
                        backfaceVisibility:
                          'hidden',
                      }}
                    >
                      <div className="flex h-full flex-col items-center justify-center rounded-[17px] border border-white/20">
                        <Trophy
                          size={27}
                        />

                        <span className="mt-3 text-[9px] font-black tracking-[0.15em]">
                          RACHA
                        </span>

                        <span className="mt-1 text-2xl font-black">
                          ?
                        </span>
                      </div>
                    </div>

                    {/* REVERSO */}

                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-zinc-900 p-3 text-white shadow-lg"
                      style={{
                        backfaceVisibility:
                          'hidden',

                        transform:
                          'rotateY(180deg)',
                      }}
                    >
                      <div className="text-center">
                        <Sparkles
                          size={28}
                          className="mx-auto text-yellow-300"
                        />

                        <p className="mt-3 text-[10px] font-black tracking-wider">
                          REVELANDO...
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              )
            },
          )}
        </div>

        {!isMyTurn &&
          selector && (
            <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-3 text-center">
              <p className="text-xs font-bold text-zinc-500">
                Esperando a{' '}
                <span className="font-black text-zinc-700">
                  {
                    selector.name
                  }
                </span>
                ...
              </p>
            </div>
          )}

        {isMyTurn &&
          choosingCard ===
            null && (
            <div className="mt-5 rounded-2xl bg-violet-50 px-4 py-3 text-center">
              <p className="text-xs font-black text-violet-600">
                Elegí una. No hay
                vuelta atrás 😈
              </p>
            </div>
          )}

        {error && (
          <p className="mt-4 text-center text-xs font-bold text-red-500">
            {error}
          </p>
        )}
      </section>

      {/* ================================= */}
      {/* QUÉ SE SORTEA */}
      {/* ================================= */}

      <section className="mt-5 rounded-[28px] bg-zinc-900 p-5 text-white shadow-sm">
        <p className="text-xs font-black tracking-wider text-violet-300">
          ¿QUÉ SE SORTEA?
        </p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">
              🎯
            </span>

            <div>
              <p className="text-sm font-black">
                Desafío
              </p>

              <p className="text-xs text-zinc-400">
                Define cómo se
                ganan los puntos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">
              ⚔️
            </span>

            <div>
              <p className="text-sm font-black">
                Modalidad
              </p>

              <p className="text-xs text-zinc-400">
                Todos contra todos
                o 2 vs 2 si son
                cuatro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">
              🎁
            </span>

            <div>
              <p className="text-sm font-black">
                Premio
              </p>

              <p className="text-xs text-zinc-400">
                El campeón se
                lleva algo de
                verdad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================= */}
      {/* HISTORIAL */}
      {/* ================================= */}

      <TournamentHistory
        history={history}
        loading={
          historyLoading
        }
      />
    </div>
  )
}

export default Torneos