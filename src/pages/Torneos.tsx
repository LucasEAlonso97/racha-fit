import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  ArrowRight,
  ChevronDown,
  Gift,
  History,
  RefreshCw,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'

import PrizeClaim from '../components/PrizeClaim'
import ShowMoreButton from '../components/ShowMoreButton'
import UserAvatar from '../components/UserAvatar'

import {
  useTournament,
} from '../hooks/useTournament'

import type {
  TournamentParticipant,
} from '../hooks/useTournament'

import {
  supabase,
} from '../lib/supabase'

import {
  formatTimeLeft,
  getTimeLeft,
} from '../lib/tournamentTime'

import type {
  Group,
  User,
} from '../types'

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
  prize_type?: string | null
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

  /* Campos nuevos (migración de premios). */
  winner_ids?: string[]
  claims?: string[]
  auto_selected?: boolean
}



/*
 * ========================================
 * HELPERS
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

const SHORT_MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

/*
 * "4 sep → 14 sep" (con año solo si
 * no es el actual).
 */
function formatShortRange(
  from: string | null,
  to: string | null,
) {
  const format = (date: string | null) => {
    if (!date) {
      return ''
    }

    const [year, month, day] =
      date.split('-').map(Number)

    const yearSuffix =
      year === new Date().getFullYear()
        ? ''
        : ` ${String(year).slice(2)}`

    return `${day} ${SHORT_MONTHS[month - 1]}${yearSuffix}`
  }

  return `${format(from)} → ${format(to)}`
}

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

function getInitials(
  name: string,
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    words.length === 0
  ) {
    return '?'
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase()
}

/*
 * ========================================
 * AVATAR DE PARTICIPANTE
 * ========================================
 *
 * Si el usuario todavía pertenece al
 * grupo usamos UserAvatar.
 *
 * Si abandonó durante el torneo,
 * seguimos mostrando el participante
 * congelado con nombre + iniciales.
 * ========================================
 */

function ParticipantAvatar({
  participant,
  user,
  size = 'sm',
}: {
  participant: {
    name: string
  }
  user?: User
  size?: 'sm' | 'lg'
}) {
  if (user) {
    return (
      <UserAvatar
        user={user}
        size={size}
      />
    )
  }

  const sizeClass =
    size === 'lg'
      ? 'h-14 w-14 text-base'
      : 'h-7 w-7 text-[9px]'

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-black text-zinc-600 ${sizeClass}`}
    >
      {getInitials(
        participant.name,
      )}
    </div>
  )
}

/*
 * ========================================
 * HISTORIAL
 * ========================================
 */

/*
 * Ganador / empate de un torneo terminado.
 */
function getTournamentResult(
  item: TournamentHistoryItem,
) {
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

      return a.name.localeCompare(
        b.name,
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

      resultTitle =
        winningTeam
          .map(
            participant =>
              participant.name,
          )
          .join(' + ')

      resultSubtitle =
        `${winningScore} pts`

      resultEmoji =
        '🏆'
    }
  }

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

  return {
    resultTitle,
    resultSubtitle,
    resultEmoji,
  }
}

/*
 * Torneos visibles antes de "Ver más".
 */
const HISTORY_PREVIEW = 3

function TournamentHistory({
  history,
  loading,
  users,
  currentUserId,
  onClaimed,
}: {
  history: TournamentHistoryItem[]
  loading: boolean
  users: User[]
  currentUserId: string
  onClaimed: () => void
}) {
  const [showAll, setShowAll] =
    useState(false)

  const [openId, setOpenId] = useState<
    string | null
  >(null)

  const visible = showAll
    ? history
    : history.slice(0, HISTORY_PREVIEW)

  return (
    <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          <History
            size={21}
          />
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-black tracking-wider text-violet-500">
            HISTORIAL
          </p>

          <h3 className="text-lg font-black text-zinc-800">
            Torneos anteriores
          </h3>
        </div>

        {history.length > 0 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-black text-zinc-500">
            {history.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-5 text-center">
          <p className="text-xs font-bold text-zinc-400">
            Cargando historial...
          </p>
        </div>
      ) : history.length ===
        0 ? (
        <div className="mt-5 rounded-2xl bg-zinc-50 px-4 py-5 text-center">
          <p className="text-2xl">
            🏆
          </p>

          <p className="mt-2 text-sm font-black text-zinc-600">
            Todavía no hay torneos terminados
          </p>

          <p className="mt-1 text-xs font-semibold text-zinc-400">
            Cuando termine el
            primero, va a aparecer
            acá.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <ul className="divide-y divide-zinc-100">
            {visible.map((item) => {
              const {
                resultTitle,
                resultSubtitle,
                resultEmoji,
              } = getTournamentResult(item)

              const open =
                openId === item.id

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenId(
                        open
                          ? null
                          : item.id,
                      )
                    }
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-xl">
                      {item.challenge
                        ?.emoji ?? '🏆'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-zinc-800">
                        {item.challenge
                          ?.name ??
                          'Torneo'}
                      </p>

                      <p className="truncate text-xs font-semibold text-zinc-400">
                        {formatShortRange(
                          item.starts_on,
                          item.ends_on,
                        )}
                      </p>
                    </div>

                    <div className="min-w-0 max-w-[40%] text-right">
                      <p className="truncate text-xs font-black text-zinc-700">
                        {resultEmoji}{' '}
                        {resultTitle}
                      </p>

                      <p className="text-[11px] font-bold text-zinc-400">
                        {resultSubtitle}
                      </p>
                    </div>

                    {(item.winner_ids ??
                      []).includes(
                      currentUserId,
                    ) &&
                      !(item.claims ??
                        []).includes(
                        currentUserId,
                      ) &&
                      item.prize
                        ?.prize_type && (
                        <span
                          title="Tenés un premio para reclamar"
                          className="h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-500"
                        />
                      )}

                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-zinc-300 transition-transform ${
                        open
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>

                  {open && (
                    <div className="mb-3 space-y-2 rounded-2xl bg-zinc-50 p-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-zinc-500">
                          {item.mode ===
                          'two_vs_two'
                            ? '2 VS 2'
                            : 'TODOS VS TODOS'}
                        </span>

                        {item.selected_card && (
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black text-violet-600">
                            Carta #
                            {
                              item.selected_card
                            }
                          </span>
                        )}
                      </div>

                      {item.prize && (
                        <PrizeClaim
                          variant="compact"
                          tournamentId={item.id}
                          prize={item.prize}
                          winnerIds={
                            item.winner_ids ??
                            []
                          }
                          claims={
                            item.claims ?? []
                          }
                          users={users}
                          currentUserId={
                            currentUserId
                          }
                          vacant={
                            item.mode ===
                              'two_vs_two' &&
                            (item.winner_ids
                              ?.length ?? 0) ===
                              0
                          }
                          onClaimed={
                            onClaimed
                          }
                        />
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <ShowMoreButton
            expanded={showAll}
            hiddenCount={
              history.length -
              HISTORY_PREVIEW
            }
            noun={
              history.length -
                HISTORY_PREVIEW ===
              1
                ? 'torneo'
                : 'torneos'
            }
            onToggle={() =>
              setShowAll(
                (current) => !current,
              )
            }
          />
        </div>
      )}
    </section>
  )
}

/*
 * ========================================
 * PODIO (todos contra todos)
 * ========================================
 */

function Podium({
  ranking,
  users,
}: {
  ranking: TournamentParticipant[]
  users: User[]
}) {
  const top = ranking.slice(0, 3)

  if (top.length === 0) {
    return null
  }

  /*
   * Orden visual: 2º · 1º · 3º
   */
  const columns = [
    {
      participant: top[1],
      medal: '🥈',
      height: 'h-16',
      color: 'from-violet-200 to-violet-300',
    },
    {
      participant: top[0],
      medal: '🥇',
      height: 'h-24',
      color: 'from-fuchsia-400 to-violet-500',
    },
    {
      participant: top[2],
      medal: '🥉',
      height: 'h-12',
      color: 'from-orange-200 to-orange-300',
    },
  ]

  return (
    <div className="flex items-end justify-center gap-2 rounded-2xl bg-gradient-to-b from-violet-50/60 to-white px-2 pb-1 pt-4">
      {columns.map(
        ({
          participant,
          medal,
          height,
          color,
        }, index) =>
          participant ? (
            <div
              key={participant.user_id}
              className="flex w-1/3 max-w-[110px] flex-col items-center"
            >
              <ParticipantAvatar
                participant={participant}
                user={users.find(
                  (user) =>
                    user.id ===
                    participant.user_id,
                )}
                size={
                  index === 1
                    ? 'lg'
                    : undefined
                }
              />

              <p className="mt-1.5 w-full truncate text-center text-xs font-black text-zinc-700">
                {participant.name}
              </p>

              <p className="text-[11px] font-bold text-zinc-400">
                {participant.score} pts
              </p>

              <div
                className={`mt-1.5 flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b pt-1.5 text-xl ${height} ${color}`}
              >
                {medal}
              </div>
            </div>
          ) : (
            <div
              key={`empty-${index}`}
              className="w-1/3 max-w-[110px]"
            />
          ),
      )}
    </div>
  )
}

/*
 * ========================================
 * PLAZO PARA ELEGIR / CONTINUAR
 * ========================================
 */

function DeadlineNote({
  deadline,
  mine,
}: {
  deadline?: string | null
  mine: boolean
}) {
  const timeLeft =
    getTimeLeft(deadline)

  if (timeLeft === null) {
    return null
  }

  return (
    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black text-violet-600">
      ⏳{' '}
      {timeLeft === 0
        ? 'Se elige solo en cualquier momento'
        : mine
          ? `Tenés ${formatTimeLeft(timeLeft)}; si no, se elige solo`
          : `Si no elige en ${formatTimeLeft(timeLeft)}, se elige solo`}
    </p>
  )
}

/*
 * ========================================
 * NECESITAMOS MÁS MIEMBROS
 * ========================================
 */

function MinimumMembersCard() {
  return (
    <section className="rounded-[28px] bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
        <UserPlus
          size={27}
        />
      </div>

      <h2 className="mt-4 text-xl font-black text-zinc-800">
        Falta alguien más
      </h2>

      <p className="mx-auto mt-2 max-w-[260px] text-sm font-semibold leading-relaxed text-zinc-500">
        Los torneos necesitan al
        menos 2 integrantes.
        Invitá a alguien al grupo
        para empezar a competir.
      </p>
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
   * MIEMBROS
   * ========================================
   */

  const hasEnoughMembers =
    users.length >= 2

  /*
   * ========================================
   * HISTORIAL
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

        setHistory(
          Array.isArray(
            data,
          )
            ? (
                data as TournamentHistoryItem[]
              )
            : [],
        )

        setHistoryLoading(
          false,
        )
      },
      [
        group.id,
      ],
    )

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
   * GRUPO DE UNA SOLA PERSONA
   * SIN TORNEO EXISTENTE
   * ========================================
   */

  if (
    !tournament &&
    !hasEnoughMembers
  ) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <header className="mb-6">
          <p className="text-xs font-black tracking-[0.15em] text-violet-500">
            COMPETÍ CON TU BANDA
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-800">
            Torneos
          </h1>
        </header>

        <MinimumMembersCard />

        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
          users={users}
          currentUserId={
            currentUserId
          }
          onClaimed={() =>
            void loadHistory()
          }
        />
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

  if (!tournament) {
    return (
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
          users={users}
          currentUserId={
            currentUserId
          }
          onClaimed={() =>
            void loadHistory()
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

    const winnerParticipant =
      tournament.winner_user_id
        ? ranking.find(
            participant =>
              participant.user_id ===
              tournament.winner_user_id,
          ) ?? null
        : null

    const winnerUser =
      winnerParticipant
        ? users.find(
            user =>
              user.id ===
              winnerParticipant.user_id,
          )
        : undefined

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

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 p-6 text-center shadow-lg shadow-fuchsia-200">
          {/* Confeti */}
          <span className="pointer-events-none absolute left-5 top-4 rotate-[-18deg] text-xl opacity-80">🎉</span>
          <span className="pointer-events-none absolute right-6 top-6 rotate-12 text-lg opacity-80">✨</span>
          <span className="pointer-events-none absolute bottom-24 left-6 text-base opacity-70">⭐</span>
          <span className="pointer-events-none absolute bottom-28 right-5 rotate-[20deg] text-lg opacity-70">🎊</span>
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative">
          {isTie ? (
            <>
              <div className="text-5xl">
                🤝
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-white/80">
                EMPATE
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                Quedó todo igualado
              </h2>

              {tournament.mode ===
              'free_for_all' ? (
                <p className="mt-2 text-sm font-semibold text-white/85">
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
                <p className="mt-2 text-sm font-semibold text-white/85">
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
              <div className="text-6xl drop-shadow-lg">
                🏆
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-white/80">
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

                    return (
                      <div
                        key={
                          participant.user_id
                        }
                        className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 backdrop-blur-sm"
                      >
                        <ParticipantAvatar
                          participant={
                            participant
                          }
                          user={user}
                        />

                        <span className="text-xs font-black text-white">
                          {
                            participant.name
                          }
                        </span>
                      </div>
                    )
                  },
                )}
              </div>

              <p className="mx-auto mt-4 w-fit rounded-full bg-white px-5 py-1.5 text-2xl font-black text-fuchsia-600 shadow-sm">
                {winningTeamNumber ===
                1
                  ? teamOneScore
                  : teamTwoScore}{' '}
                pts
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl drop-shadow-lg">
                🏆
              </div>

              <p className="mt-4 text-xs font-black tracking-[0.16em] text-white/80">
                CAMPEÓN
              </p>

              {winnerParticipant && (
                <div className="mt-4 flex justify-center">
                  <ParticipantAvatar
                    participant={
                      winnerParticipant
                    }
                    user={
                      winnerUser
                    }
                    size="lg"
                  />
                </div>
              )}

              <h2 className="mt-3 text-2xl font-black text-white">
                {winnerParticipant
                  ?.name ??
                  ranking[0]
                    ?.name ??
                  'Ganador'}
              </h2>

              <p className="mx-auto mt-3 w-fit rounded-full bg-white px-5 py-1.5 text-2xl font-black text-fuchsia-600 shadow-sm">
                {topScore}{' '}
                pts
              </p>
            </>
          )}

          {tournament.challenge && (
            <div className="mt-6 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/70">
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
          </div>
        </section>

        {tournament.prize && (
          <PrizeClaim
            tournamentId={tournament.id}
            prize={tournament.prize}
            winnerIds={
              tournament.winner_ids ?? []
            }
            claims={
              tournament.claims ?? []
            }
            users={users}
            currentUserId={currentUserId}
            vacant={teamTie}
            onClaimed={() => {
              void refresh()
              void loadHistory()
            }}
          />
        )}

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
              {[
                {
                  number: 1,
                  members:
                    teamOne,
                  score:
                    teamOneScore,
                  classes:
                    winningTeamNumber === 1
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200'
                      : 'bg-violet-50 text-violet-700',
                },
                {
                  number: 2,
                  members:
                    teamTwo,
                  score:
                    teamTwoScore,
                  classes:
                    winningTeamNumber === 2
                      ? 'bg-gradient-to-br from-orange-400 to-fuchsia-500 text-white shadow-md shadow-orange-200'
                      : 'bg-orange-50 text-orange-600',
                },
              ].map(
                team => (
                  <div
                    key={
                      team.number
                    }
                    className={`rounded-2xl p-4 ${team.classes}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black">
                        {winningTeamNumber ===
                          team.number &&
                          '🏆 '}
                        Equipo{' '}
                        {
                          team.number
                        }
                      </p>

                      <p className="text-lg font-black">
                        {
                          team.score
                        }{' '}
                        pts
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {team.members.map(
                        participant => (
                          <div
                            key={
                              participant.user_id
                            }
                            className="flex items-center justify-between text-xs"
                          >
                            <span
                              className={`font-bold ${
                                winningTeamNumber ===
                                team.number
                                  ? 'text-white/90'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {
                                participant.name
                              }
                            </span>

                            <span
                              className={`font-black ${
                                winningTeamNumber ===
                                team.number
                                  ? 'text-white'
                                  : 'text-zinc-700'
                              }`}
                            >
                              {
                                participant.score
                              }
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <Podium
                ranking={ranking}
                users={users}
              />

              {ranking.slice(3).map(
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

                  const position =
                    getRankingPosition(
                      ranking,
                      index + 3,
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

                        <ParticipantAvatar
                          participant={
                            participant
                          }
                          user={user}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-700">
                            {
                              participant.name
                            }
                          </p>

                          {!user && (
                            <p className="text-[9px] font-bold text-zinc-400">
                              Ya no está en el grupo
                            </p>
                          )}
                        </div>
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

              <div>
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

                <DeadlineNote
                  deadline={
                    tournament.selection_deadline
                  }
                  mine={isMyNextTurn}
                />
              </div>
            </div>

            {!hasEnoughMembers ? (
              <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-center">
                <p className="text-xs font-bold text-zinc-600">
                  Hace falta al menos
                  otra persona para
                  empezar el próximo
                  torneo.
                </p>
              </div>
            ) : isMyNextTurn ? (
              <button
                type="button"
                disabled={
                  continuing
                }
                onClick={() =>
                  void continueTournament()
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
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
          users={users}
          currentUserId={
            currentUserId
          }
          onClaimed={() =>
            void loadHistory()
          }
        />
      </div>
    )
  }

  /*
   * ========================================
   * ACTIVO
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
              <h1 className="text-3xl font-black text-zinc-800">
                Torneos
              </h1>

              <p className="text-sm font-semibold text-zinc-500">
                Ahora sí. A competir.
              </p>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-lg shadow-fuchsia-200">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-white/80">
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

              <div className="rounded-full bg-white/20 px-3 py-2 text-[10px] font-black text-white">
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

            {tournament.auto_selected && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black text-white">
                ⏳ La carta se eligió sola
                (pasaron 48 h)
              </p>
            )}

            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/90">
              {
                tournament
                  .challenge
                  .description
              }
            </p>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/20 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase text-white/70">
                  Empieza
                </p>

                <p className="mt-1 text-xs font-black text-white">
                  {formatDate(
                    tournament.starts_on,
                  )}
                </p>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-white/70">
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
              tournament.challenge.scoring_type,
            ).map(
              rule => (
                <div
                  key={rule}
                  className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-3"
                >
                  <div className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-violet-500" />

                  <p className="text-sm font-semibold text-zinc-600">
                    {rule}
                  </p>
                </div>
              ),
            )}
          </div>

          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700">
              🃏 Los días recuperados
              con comodín no suman
              puntos en Torneos.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              {
                tournament
                  .prize
                  .emoji
              }
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Gift
                  size={14}
                  className="text-amber-600"
                />

                <p className="text-[10px] font-black text-amber-600">
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

              <p className="mt-1 text-sm font-semibold text-zinc-500">
                {
                  tournament
                    .prize
                    .description
                }
              </p>
            </div>
          </div>
        </section>

        {tournament.mode ===
        'two_vs_two' ? (
          <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Swords
                size={20}
                className="text-violet-500"
              />

              <h3 className="text-lg font-black text-zinc-800">
                Batalla por equipos
              </h3>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  number: 1,
                  members:
                    teamOne,
                  score:
                    teamOneScore,
                  winning:
                    teamOneWinning,
                  container:
                    'border-violet-200 bg-violet-50',
                  points:
                    'text-violet-600',
                },
                {
                  number: 2,
                  members:
                    teamTwo,
                  score:
                    teamTwoScore,
                  winning:
                    teamTwoWinning,
                  container:
                    'border-orange-200 bg-orange-50',
                  points:
                    'text-orange-500',
                },
              ].map(
                team => (
                  <div
                    key={
                      team.number
                    }
                    className={`rounded-[24px] border p-4 ${
                      team.winning
                        ? team.container
                        : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-zinc-800">
                          {team.winning
                            ? '👑 '
                            : ''}
                          Equipo{' '}
                          {
                            team.number
                          }
                        </p>

                        <p className="mt-1 text-[10px] font-black text-zinc-400">
                          {team.winning
                            ? 'VA GANANDO'
                            : teamsTied
                              ? 'EMPATE'
                              : 'EN JUEGO'}
                        </p>
                      </div>

                      <p className={`text-3xl font-black ${team.points}`}>
                        {
                          team.score
                        }
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      {team.members.map(
                        participant => {
                          const user =
                            users.find(
                              item =>
                                item.id ===
                                participant.user_id,
                            )

                          return (
                            <div
                              key={
                                participant.user_id
                              }
                              className="flex items-center justify-between rounded-2xl bg-white px-3 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <ParticipantAvatar
                                  participant={
                                    participant
                                  }
                                  user={
                                    user
                                  }
                                />

                                <div>
                                  <p className="text-sm font-black text-zinc-700">
                                    {
                                      participant.name
                                    }
                                  </p>

                                  {participant.user_id ===
                                    currentUserId && (
                                    <p className="text-[9px] font-black text-violet-500">
                                      VOS
                                    </p>
                                  )}

                                  {!user && (
                                    <p className="text-[9px] font-bold text-zinc-400">
                                      Ya no está en el grupo
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
                ),
              )}
            </div>
          </section>
        ) : (
          <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Users
                size={20}
                className="text-violet-500"
              />

              <h3 className="text-lg font-black text-zinc-800">
                Todos contra todos
              </h3>
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
                        <div className="w-8 text-center text-lg">
                          {getPositionLabel(
                            position,
                          )}
                        </div>

                        <ParticipantAvatar
                          participant={
                            participant
                          }
                          user={
                            user
                          }
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-700">
                            {
                              participant.name
                            }
                          </p>

                          {participant.user_id ===
                            currentUserId && (
                            <p className="text-[9px] font-black text-violet-500">
                              VOS
                            </p>
                          )}

                          {!user && (
                            <p className="text-[9px] font-bold text-zinc-400">
                              Ya no está en el grupo
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-lg font-black text-zinc-800">
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
          </section>
        )}

        <section className="mt-4 rounded-2xl bg-violet-50 px-4 py-3">
          <p className="text-xs font-semibold text-violet-700">
            Los puntos se actualizan
            automáticamente con las
            actividades registradas
            durante el torneo.
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

        <TournamentHistory
          history={history}
          loading={
            historyLoading
          }
          users={users}
          currentUserId={
            currentUserId
          }
          onClaimed={() =>
            void loadHistory()
          }
        />
      </div>
    )
  }

  /*
   * ========================================
   * ESPERANDO CARTA
   * ========================================
   */

  const canChooseCard =
    hasEnoughMembers &&
    isMyTurn

  return (
    <div className="mx-auto w-full max-w-md px-5 pb-8 pt-6">
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
            <h1 className="text-3xl font-black text-zinc-800">
              Torneos
            </h1>

            <p className="text-sm font-semibold text-zinc-500">
              Acá sí hay algo en
              juego.
            </p>
          </div>
        </div>
      </header>

      {!hasEnoughMembers && (
        <div className="mb-5">
          <MinimumMembersCard />
        </div>
      )}

      <section className="mb-5 rounded-[28px] bg-gradient-to-br from-violet-100 via-violet-50 to-pink-50 p-5 shadow-sm">
        <p className="text-xs font-black tracking-wider text-violet-500">
          ¿QUIÉN ELIGE?
        </p>

        {selector ? (
          <div className="mt-4 flex items-center gap-3">
            <UserAvatar
              user={
                selector
              }
              size="lg"
            />

            <div>
              <p className="text-base font-black text-zinc-800">
                {isMyTurn
                  ? 'Te toca a vos 😈'
                  : `Le toca a ${selector.name}`}
              </p>

              <p className="mt-1 text-xs font-semibold text-zinc-500">
                El turno rota entre
                todos los integrantes.
              </p>

              <DeadlineNote
                deadline={
                  tournament.selection_deadline
                }
                mine={isMyTurn}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-zinc-500">
            Recalculando el próximo
            turno...
          </p>
        )}
      </section>

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
            className="text-violet-500"
          />
        </div>

        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Desafío, modalidad y premio
          se revelan juntos.
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
                    !canChooseCard ||
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
                    canChooseCard &&
                    !choosingCard
                      ? 'hover:-translate-y-1 active:scale-95'
                      : 'cursor-default'
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
                    <div
                      className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-violet-500 via-violet-600 to-purple-700 p-2 text-white shadow-lg"
                      style={{
                        backfaceVisibility:
                          'hidden',
                      }}
                    >
                      <div className="flex h-full flex-col items-center justify-center rounded-[17px] border border-white/20">
                        <Trophy
                          size={27}
                        />

                        <span className="mt-3 text-[9px] font-black">
                          RACHA
                        </span>

                        <span className="mt-1 text-2xl font-black">
                          ?
                        </span>
                      </div>
                    </div>

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

                        <p className="mt-3 text-[10px] font-black">
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

        {!hasEnoughMembers ? (
          <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-center">
            <p className="text-xs font-bold text-amber-700">
              Sumá al menos una
              persona más para poder
              revelar una carta.
            </p>
          </div>
        ) : !isMyTurn &&
          selector ? (
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
        ) : choosingCard ===
          null ? (
          <div className="mt-5 rounded-2xl bg-violet-50 px-4 py-3 text-center">
            <p className="text-xs font-black text-violet-600">
              Elegí una. No hay
              vuelta atrás 😈
            </p>
          </div>
        ) : null}

        {error && (
          <p className="mt-4 text-center text-xs font-bold text-red-500">
            {error}
          </p>
        )}
      </section>

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
                Define cómo se ganan
                los puntos.
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
                Todos contra todos o
                2 vs 2 si son cuatro.
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
                El campeón se lleva
                algo de verdad.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TournamentHistory
        history={history}
        loading={
          historyLoading
        }
        users={users}
        currentUserId={
          currentUserId
        }
        onClaimed={() =>
          void loadHistory()
        }
      />
    </div>
  )
}

export default Torneos