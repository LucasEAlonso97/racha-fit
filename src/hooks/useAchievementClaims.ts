import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

/*
 * ========================================
 * LOGROS RECLAMADOS
 * ========================================
 *
 * Qué logros ya reclamó la persona y la
 * función para reclamar uno. Si la
 * migración de logros con regalos todavía
 * no se corrió, available = false y la app
 * muestra los logros como antes.
 */

export type ClaimResult =
  | {
      ok: true
      crown: boolean
    }
  | {
      ok: false
      message: string
    }

const ERROR_MESSAGES: Record<
  string,
  string
> = {
  ALREADY_CLAIMED:
    'Ese regalo ya lo reclamaste.',
  NOT_COMPLETED:
    'Todavía no está cumplido. Si cargaste algo sin señal, esperá a que se envíe.',
  WILDCARDS_FULL:
    'Ya tenés 6 comodines, el máximo. Usá alguno y volvé a reclamarlo: el regalo te espera.',
  NO_GIFT:
    'Este logro no tiene regalo.',
  NOT_MEMBER:
    'No sos parte de este grupo.',
  UNKNOWN_ACHIEVEMENT:
    'No encontramos ese logro.',
}

function isMissingSchema(
  code: string | undefined,
) {
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === '42883'
  )
}

export function useAchievementClaims(
  userId: string,
) {
  const [claimed, setClaimed] =
    useState<Set<string>>(
      () => new Set(),
    )

  const [available, setAvailable] =
    useState(false)

  const [loaded, setLoaded] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } =
        await supabase
          .from('achievement_claims')
          .select('achievement_id')
          .eq('user_id', userId)

      if (cancelled) {
        return
      }

      if (error) {
        if (!isMissingSchema(error.code)) {
          console.error(
            'Error cargando logros reclamados:',
            error,
          )
        }

        setAvailable(false)
        setLoaded(true)

        return
      }

      setClaimed(
        new Set(
          (
            (data ?? []) as {
              achievement_id: string
            }[]
          ).map(
            (row) => row.achievement_id,
          ),
        ),
      )

      setAvailable(true)
      setLoaded(true)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId])

  const claim = useCallback(
    async (
      groupId: string,
      achievementId: string,
    ): Promise<ClaimResult> => {
      const { data, error } =
        await supabase.rpc(
          'claim_achievement_reward',
          {
            p_group_id: groupId,
            p_achievement_id:
              achievementId,
          },
        )

      if (error) {
        const code = Object.keys(
          ERROR_MESSAGES,
        ).find((key) =>
          error.message?.includes(key),
        )

        if (code === 'ALREADY_CLAIMED') {
          setClaimed((current) =>
            new Set(current).add(
              achievementId,
            ),
          )
        }

        return {
          ok: false,
          message: code
            ? ERROR_MESSAGES[code]
            : 'No pudimos reclamar el regalo. Probá de nuevo.',
        }
      }

      setClaimed((current) =>
        new Set(current).add(
          achievementId,
        ),
      )

      return {
        ok: true,
        crown: Boolean(
          (
            data as {
              crown_until?: string | null
            } | null
          )?.crown_until,
        ),
      }
    },
    [],
  )

  return {
    claimed,
    available,
    loaded,
    claim,
  }
}
