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
  weekly_goal_at_start?: number
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

export type TournamentHistoryItem = {
  id: string
  group_id: string

  selector_user_id: string

  selected_card:
    number | null

  mode:
    TournamentMode | null

  starts_on:
    string | null

  ends_on:
    string | null

  finished_at:
    string | null

  winner_user_id:
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

  history:
    TournamentHistoryItem[]

  loading:
    boolean

  historyLoading:
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
    history,
    setHistory,
  ] =
    useState<
      TournamentHistoryItem[]
    >([])

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    historyLoading,
    setHistoryLoading,
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
   * HISTORIAL
   * ========================================
   */

  const fetchHistory =
    useCallback(
      async (
        silent = false,
      ) => {
        if (!groupId) {
          return
        }

        if (!silent) {
          setHistoryLoading(
            true,
          )
        }

        const {
          data,
          error:
            historyError,
        } =
          await supabase.rpc(
            'get_tournament_history',
            {
              p_group_id:
                groupId,

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

          if (!silent) {
            setHistoryLoading(
              false,
            )
          }

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

        if (!silent) {
          setHistoryLoading(
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

        /*
         * ==================================
         * TRAER TORNEO
         * ==================================
         */

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
            tournamentError.message ||
              'No pudimos cargar el torneo.',
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
         * ¿YA TERMINÓ?
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

          /*
           * Si acaba de terminar,
           * volvemos a traerlo.
           */

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

        /*
         * ==================================
         * ERROR SEGUNDA CONSULTA
         * ==================================
         */

        if (
          tournamentError
        ) {
          console.error(
            'Error cargando resultado del torneo:',
            tournamentError,
          )

          setError(
            tournamentError.message ||
              'No pudimos cargar el resultado.',
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
         * GUARDAR TORNEO
         * ==================================
         */

        setTournament(
          (
            data ??
            null
          ) as Tournament | null,
        )

        setError(
          null,
        )

        /*
         * También refrescamos
         * el historial.
         */

        await fetchHistory(
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
        fetchHistory,
      ],
    )

  /*
   * ========================================
   * PREPARAR TORNEO
   * ========================================
   */

  const prepareTournament =
    useCallback(
      async () => {
        if (!groupId) {
          return
        }

        setLoading(
          true,
        )

        setHistoryLoading(
          true,
        )

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
            prepareError.message ||
              'No pudimos preparar el próximo torneo.',
          )

          setLoading(
            false,
          )

          setHistoryLoading(
            false,
          )

          return
        }

        await fetchCurrentTournament(
          true,
        )

        setLoading(
          false,
        )

        setHistoryLoading(
          false,
        )
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

          const message =
            chooseError.message
              ?.toLowerCase() ??
            ''

          if (
            message.includes(
              'not your turn',
            )
          ) {
            setError(
              'Todavía no te toca elegir.',
            )
          } else if (
            message.includes(
              'already revealed',
            )
          ) {
            setError(
              'Este torneo ya fue revelado.',
            )
          } else {
            setError(
              chooseError.message ||
                'No pudimos revelar la carta.',
            )
          }

          setChoosingCard(
            null,
          )

          choosingRef.current =
            false

          await fetchCurrentTournament(
            true,
          )

          return false
        }

        /*
         * ==================================
         * ANIMACIÓN
         * ==================================
         */

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
              continueError.message ||
                'No pudimos preparar el siguiente torneo.',
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

        /*
         * Acá el torneo anterior
         * pasa automáticamente
         * al historial.
         */

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
         * CAMBIOS DEL TORNEO
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
          void fetchCurrentTournament(
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
    fetchCurrentTournament,
  ])

  /*
   * ========================================
   * RESULTADO
   * ========================================
   */

  return {
    tournament,
    history,

    loading,
    historyLoading,

    error,

    choosingCard,
    continuing,

    chooseCard,
    continueTournament,

    refresh:
      fetchCurrentTournament,
  }
}