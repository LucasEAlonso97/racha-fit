import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

import {
  claimConsistencyWildcards,
} from '../lib/consistency'

export function useWildcards(
  userId: string,
) {
  const [
    balance,
    setBalance,
  ] =
    useState<number | null>(
      null,
    )

  const [
    nextGrantDate,
    setNextGrantDate,
  ] =
    useState<string | null>(
      null,
    )

  const [
    recoveredDates,
    setRecoveredDates,
  ] =
    useState<string[]>([])

  /*
   * Comodines por constancia: semanas
   * seguidas cumpliendo la meta (de 0 a 3,
   * a la 4ª se gana uno) y cuántos se
   * ganaron en esta apertura.
   */
  const [
    consistencyRun,
    setConsistencyRun,
  ] =
    useState<number | null>(
      null,
    )

  const [
    consistencyAtCap,
    setConsistencyAtCap,
  ] =
    useState(false)

  const [
    justEarned,
    setJustEarned,
  ] =
    useState(0)

  const refresh =
    useCallback(
      async () => {
        const consistency =
          await claimConsistencyWildcards()

        if (consistency) {
          setConsistencyRun(
            consistency.run,
          )

          setConsistencyAtCap(
            consistency.atCap,
          )

          if (
            consistency.granted > 0
          ) {
            setJustEarned(
              consistency.granted,
            )
          }
        }

        const [
          walletResult,
          recoveriesResult,
        ] =
          await Promise.all([
            supabase.rpc(
              'get_my_wildcards',
            ),

            supabase
              .from(
                'wildcard_recoveries',
              )
              .select(
                'activity_date',
              )
              .eq(
                'user_id',
                userId,
              ),
          ])

        if (
          walletResult.error
        ) {
          console.error(
            'Error cargando comodines:',
            walletResult.error,
          )
        } else {
          const wallet =
            walletResult.data?.[0]

          setBalance(
            Number(
              wallet?.balance ??
                0,
            ),
          )

          setNextGrantDate(
            wallet?.next_grant_date ??
              null,
          )
        }

        if (
          recoveriesResult.error
        ) {
          console.error(
            'Error cargando días recuperados:',
            recoveriesResult.error,
          )
        } else {
          setRecoveredDates(
            (
              recoveriesResult.data ??
              []
            ).map(
              (recovery) =>
                recovery.activity_date,
            ),
          )
        }
      },
      [userId],
    )

  useEffect(() => {
    void refresh()
  }, [
    refresh,
  ])

  const dismissJustEarned =
    useCallback(
      () => setJustEarned(0),
      [],
    )

  return {
    balance,
    consistencyRun,
    consistencyAtCap,
    justEarned,
    dismissJustEarned,
    nextGrantDate,
    recoveredDates,
    refresh,
  }
}