import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

export type TournamentMode =
  | 'free_for_all'
  | 'two_vs_two'

export type TournamentStatus =
  | 'waiting_selection'
  | 'active'
  | 'finished'

export type TournamentChallenge = {
  id: string
  name: string
  emoji: string
  description: string
  scoring_type: string
}

export type TournamentPrize = {
  id: string
  title: string
  emoji: string
  description: string
  category: string
}

export type TournamentParticipant = {
  user_id: string
  name: string
  team_number: number | null
  score: number
}

export type Tournament = {
  id: string
  group_id: string
  selector_user_id: string
  selector_position: number

  selected_card:
    number | null

  mode:
    TournamentMode | null

  status:
    TournamentStatus

  starts_on:
    string | null

  ends_on:
    string | null

  winner_user_id:
    string | null

  finished_at:
    string | null

  result_acknowledged_at:
    string | null

  next_selector_user_id:
    string | null

  challenge:
    TournamentChallenge | null

  prize:
    TournamentPrize | null

  participants:
    TournamentParticipant[]
}

type UseTournamentResult = {
  tournament:
    Tournament | null

  loading:
    boolean

  error:
    string | null

  choosingCard:
    number | null

  continuing:
    boolean

  chooseCard: (
    card: number,
  ) => Promise<boolean>

  continueTournament:
    () => Promise<boolean>

  refresh:
    () => Promise<void>
}

const sleep = (
  milliseconds: number,
) =>
  new Promise<void>(
    resolve => {
      window.setTimeout(
        resolve,
        milliseconds,
      )
    },
  )

function getFriendlyTournamentError(
  message:
    | string
    | undefined,
) {
  const normalized =
    message
      ?.toLowerCase() ??
    ''

  if (
    normalized.includes(
      'at least two members',
    )
  ) {
    return 'Necesitan ser al menos 2 integrantes para empezar un torneo.'
  }

  if (
    normalized.includes(
      'not your turn',
    )
  ) {
    return 'Todavía no te toca elegir.'
  }

  if (
    normalized.includes(
      'already revealed',
    )
  ) {
    return 'Este torneo ya fue revelado.'
  }

  return (
    message ||
    'Ocurrió un problema con el torneo.'
  )
}

export function useTournament(
  groupId: string,
): UseTournamentResult {
  const [
    tournament,
    setTournament,
  ] =
    useState<Tournament | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    choosingCard,
    setChoosingCard,
  ] =
    useState<number | null>(
      null,
    )

  const [
    continuing,
    setContinuing,
  ] =
    useState(false)

  /*
   * ========================================
   * REFS
   * ========================================
   */

  const choosingRef =
    useRef(false)

  const continuingRef =
    useRef(false)

  /*
   * ========================================
   * OBTENER TORNEO ACTUAL
   * ========================================
   */

  const fetchCurrentTournament =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!groupId) {
          return
        }

        if (!silent) {
          setLoading(
            true,
          )
        }

        let {
          data,
          error:
            tournamentError,
        } =
          await supabase.rpc(
            'get_current_tournament',
            {
              p_group_id:
                groupId,
            },
          )

        if (
          tournamentError
        ) {
          console.error(
            'Error cargando torneo:',
            tournamentError,
          )

          setError(
            getFriendlyTournamentError(
              tournamentError.message,
            ),
          )

          if (!silent) {
            setLoading(
              false,
            )
          }

          return
        }

        /*
         * ==================================
         * COMPROBAR SI YA TERMINÓ
         * ==================================
         */

        if (
          data &&
          data.status ===
            'active'
        ) {
          const {
            data:
              finishResult,

            error:
              finishError,
          } =
            await supabase.rpc(
              'finish_tournament_if_needed',
              {
                p_tournament_id:
                  data.id,
              },
            )

          if (
            finishError
          ) {
            console.error(
              'Error cerrando torneo:',
              finishError,
            )
          }

          if (
            !finishError &&
            finishResult?.finished
          ) {
            const {
              data:
                finishedData,

              error:
                finishedError,
            } =
              await supabase.rpc(
                'get_current_tournament',
                {
                  p_group_id:
                    groupId,
                },
              )

            data =
              finishedData

            tournamentError =
              finishedError
          }
        }

        if (
          tournamentError
        ) {
          console.error(
            'Error cargando resultado del torneo:',
            tournamentError,
          )

          setError(
            getFriendlyTournamentError(
              tournamentError.message,
            ),
          )

          if (!silent) {
            setLoading(
              false,
            )
          }

          return
        }

        setTournament(
          (
            data ??
            null
          ) as Tournament | null,
        )

        setError(
          null,
        )

        if (!silent) {
          setLoading(
            false,
          )
        }
      },
      [
        groupId,
      ],
    )

  /*
   * ========================================
   * PREPARAR / RECONCILIAR TORNEO
   * ========================================
   */

  const prepareTournament =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!groupId) {
          return
        }

        if (!silent) {
          setLoading(
            true,
          )
        }

        setError(
          null,
        )

        const {
          error:
            prepareError,
        } =
          await supabase.rpc(
            'prepare_next_tournament',
            {
              p_group_id:
                groupId,
            },
          )

        if (
          prepareError
        ) {
          console.error(
            'Error preparando torneo:',
            prepareError,
          )

          setError(
            getFriendlyTournamentError(
              prepareError.message,
            ),
          )

          if (
            prepareError.message
              ?.toLowerCase()
              .includes(
                'at least two members',
              )
          ) {
            setTournament(
              null,
            )
          }

          if (!silent) {
            setLoading(
              false,
            )
          }

          return
        }

        await fetchCurrentTournament(
          true,
        )

        if (!silent) {
          setLoading(
            false,
          )
        }
      },
      [
        groupId,
        fetchCurrentTournament,
      ],
    )

  /*
   * ========================================
   * ELEGIR CARTA
   * ========================================
   */

  const chooseCard =
    useCallback(
      async (
        card: number,
      ) => {
        if (
          !tournament ||
          tournament.status !==
            'waiting_selection' ||
          choosingRef.current
        ) {
          return false
        }

        if (
          card < 1 ||
          card > 3
        ) {
          return false
        }

        choosingRef.current =
          true

        setChoosingCard(
          card,
        )

        setError(
          null,
        )

        const startedAt =
          Date.now()

        const {
          error:
            chooseError,
        } =
          await supabase.rpc(
            'choose_tournament_card',
            {
              p_tournament_id:
                tournament.id,

              p_card:
                card,
            },
          )

        if (
          chooseError
        ) {
          console.error(
            'Error revelando carta:',
            chooseError,
          )

          setError(
            getFriendlyTournamentError(
              chooseError.message,
            ),
          )

          setChoosingCard(
            null,
          )

          choosingRef.current =
            false

          await prepareTournament(
            true,
          )

          return false
        }

        const elapsed =
          Date.now() -
          startedAt

        const minimumAnimation =
          750

        if (
          elapsed <
          minimumAnimation
        ) {
          await sleep(
            minimumAnimation -
              elapsed,
          )
        }

        await fetchCurrentTournament(
          true,
        )

        setChoosingCard(
          null,
        )

        choosingRef.current =
          false

        return true
      },
      [
        tournament,
        fetchCurrentTournament,
        prepareTournament,
      ],
    )

  /*
   * ========================================
   * CONTINUAR DESPUÉS DEL RESULTADO
   * ========================================
   */

  const continueTournament =
    useCallback(
      async () => {
        if (
          !tournament ||
          tournament.status !==
            'finished' ||
          continuingRef.current
        ) {
          return false
        }

        continuingRef.current =
          true

        setContinuing(
          true,
        )

        setError(
          null,
        )

        const {
          error:
            continueError,
        } =
          await supabase.rpc(
            'continue_after_tournament',
            {
              p_tournament_id:
                tournament.id,
            },
          )

        if (
          continueError
        ) {
          console.error(
            'Error continuando torneo:',
            continueError,
          )

          const message =
            continueError.message
              ?.toLowerCase() ??
            ''

          if (
            message.includes(
              'not your turn',
            )
          ) {
            setError(
              'Le toca a otro integrante preparar el próximo torneo.',
            )
          } else {
            setError(
              getFriendlyTournamentError(
                continueError.message,
              ),
            )
          }

          setContinuing(
            false,
          )

          continuingRef.current =
            false

          await fetchCurrentTournament(
            true,
          )

          return false
        }

        await fetchCurrentTournament(
          true,
        )

        setContinuing(
          false,
        )

        continuingRef.current =
          false

        return true
      },
      [
        tournament,
        fetchCurrentTournament,
      ],
    )

  /*
   * ========================================
   * CARGA INICIAL
   * ========================================
   */

  useEffect(() => {
    void prepareTournament()
  }, [
    prepareTournament,
  ])

  /*
   * ========================================
   * REALTIME
   * ========================================
   *
   * Escuchamos:
   *
   * - tournaments
   * - activities
   * - group_members
   */

  useEffect(() => {
    if (!groupId) {
      return
    }

    const channel =
      supabase
        .channel(
          `racha-tournament-${groupId}`,
        )

        /*
         * ==================================
         * TORNEOS
         * ==================================
         */

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'tournaments',

            filter:
              `group_id=eq.${groupId}`,
          },
          () => {
            if (
              choosingRef.current ||
              continuingRef.current
            ) {
              return
            }

            void fetchCurrentTournament(
              true,
            )
          },
        )

        /*
         * ==================================
         * ACTIVIDADES
         * ==================================
         */

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'activities',

            filter:
              `group_id=eq.${groupId}`,
          },
          () => {
            if (
              choosingRef.current ||
              continuingRef.current
            ) {
              return
            }

            void fetchCurrentTournament(
              true,
            )
          },
        )

        /*
         * ==================================
         * MIEMBROS
         * ==================================
         *
         * Si alguien entra o sale:
         *
         * - recalculamos selector
         * - mantenemos participantes
         *   del torneo activo congelados
         */

        .on(
          'postgres_changes',
          {
            event:
              '*',

            schema:
              'public',

            table:
              'group_members',

            filter:
              `group_id=eq.${groupId}`,
          },
          () => {
            if (
              choosingRef.current ||
              continuingRef.current
            ) {
              return
            }

            void prepareTournament(
              true,
            )
          },
        )

        .subscribe(
          status => {
            if (
              status ===
              'SUBSCRIBED'
            ) {
              console.log(
                'Torneos Realtime conectado',
              )
            }

            if (
              status ===
              'CHANNEL_ERROR'
            ) {
              console.error(
                'Error conectando Torneos Realtime',
              )
            }
          },
        )

    return () => {
      void supabase.removeChannel(
        channel,
      )
    }
  }, [
    groupId,
    fetchCurrentTournament,
    prepareTournament,
  ])

  /*
   * ========================================
   * REFRESH AL VOLVER A LA APP
   * ========================================
   */

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          void prepareTournament(
            true,
          )
        }
      }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [
    prepareTournament,
  ])

  /*
   * ========================================
   * RETURN
   * ========================================
   */

  return {
    tournament,
    loading,
    error,
    choosingCard,
    continuing,
    chooseCard,
    continueTournament,
    refresh:
      fetchCurrentTournament,
  }
}