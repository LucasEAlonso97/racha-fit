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
         *
         * Si está activo, preguntamos
         * al backend si la fecha ya venció.
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
           * Si acaba de finalizar,
           * volvemos a consultar.
           *
           * Ahora get_current_tournament
           * devolverá el resultado
           * pendiente de confirmar.
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
         * GUARDAR
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

          return
        }

        await fetchCurrentTournament(
          true,
        )

        setLoading(
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

        /*
         * Solo existen tres cartas.
         */

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

        /*
         * ==================================
         * ERROR
         * ==================================
         */

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

          /*
           * Puede que otro usuario
           * haya revelado justo antes.
           */

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

        /*
         * ==================================
         * TRAER RESULTADO DEL REVEAL
         * ==================================
         */

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
   *
   * Solamente puede hacerlo
   * quien tiene el próximo turno.
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

        /*
         * ==================================
         * ERROR
         * ==================================
         */

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
         * ==================================
         * NUEVO TORNEO
         * ==================================
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
   *
   * Escuchamos:
   *
   * - tournaments
   * - activities
   *
   * Así:
   *
   * - todos ven el reveal
   * - todos ven el cierre
   * - todos ven el siguiente torneo
   * - el ranking cambia solo
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
            /*
             * No cortamos animaciones
             * o transiciones iniciadas
             * por este mismo dispositivo.
             */

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

            /*
             * get_current_tournament()
             * sincroniza scores.
             */

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

    /*
     * ========================================
     * CLEANUP
     * ========================================
     */

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
   *
   * Esto es importante en celular:
   *
   * si alguien deja la PWA cerrada
   * y vuelve después de que terminó
   * un torneo, comprobamos su estado.
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