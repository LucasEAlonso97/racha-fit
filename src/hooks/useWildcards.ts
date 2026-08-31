import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

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

  const refresh =
    useCallback(
      async () => {
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

  return {
    balance,
    nextGrantDate,
    recoveredDates,
    refresh,
  }
}