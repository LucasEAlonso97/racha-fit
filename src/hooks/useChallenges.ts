import {
  useEffect,
  useState,
} from 'react'

import {
  CHALLENGE_COLUMNS,
} from '../lib/challenges'

import type {
  Challenge,
} from '../lib/challenges'

import {
  showToast,
} from '../lib/feedback'

import {
  supabase,
} from '../lib/supabase'

/*
 * ========================================
 * DESAFÍOS DEL GRUPO
 * ========================================
 *
 * Si la tabla todavía no existe (falta
 * correr la migración), devuelve
 * available = false y la app esconde
 * los desafíos sin romperse.
 */

export function useChallenges(
  groupId: string | null,
  currentUserId: string,
) {
  const [challenges, setChallenges] =
    useState<Challenge[]>([])

  const [available, setAvailable] =
    useState(true)

  const [refreshKey, setRefreshKey] =
    useState(0)

  useEffect(() => {
    if (!groupId) {
      return
    }

    let cancelled = false

    const load = async () => {
      const { data, error } =
        await supabase
          .from('group_challenges')
          .select(CHALLENGE_COLUMNS)
          .eq('group_id', groupId)
          .order('starts_on', {
            ascending: false,
          })

      if (cancelled) {
        return
      }

      if (error) {
        /*
         * 42P01 / PGRST205: no existe
         * la tabla.
         */
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205'
        ) {
          setAvailable(false)
        } else {
          console.error(
            'Error cargando desafíos:',
            error,
          )
        }

        setChallenges([])

        return
      }

      setAvailable(true)
      setChallenges(
        (data ?? []) as Challenge[],
      )
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [groupId, refreshKey])

  /*
   * Tiempo real: canal propio, así si la
   * tabla no existe no afecta a los demás.
   */
  useEffect(() => {
    if (!groupId) {
      return
    }

    const channel = supabase
      .channel(`racha-challenges-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_challenges',
          filter: `group_id=eq.${groupId}`,
        },
        () =>
          setRefreshKey(
            (current) => current + 1,
          ),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [groupId])

  const createChallenge = async (
    input: Pick<
      Challenge,
      | 'title'
      | 'target_days'
      | 'starts_on'
      | 'ends_on'
    >,
  ) => {
    if (!groupId) {
      return false
    }

    const { data, error } =
      await supabase
        .from('group_challenges')
        .insert({
          ...input,
          group_id: groupId,
          created_by: currentUserId,
        })
        .select(CHALLENGE_COLUMNS)
        .single()

    if (error || !data) {
      console.error(
        'Error creando desafío:',
        error,
      )

      showToast(
        'No pudimos crear el desafío.',
      )

      return false
    }

    setChallenges((current) => [
      data as Challenge,
      ...current.filter(
        (challenge) =>
          challenge.id !==
          (data as Challenge).id,
      ),
    ])

    return true
  }

  const deleteChallenge = async (
    challengeId: string,
  ) => {
    const { error } = await supabase
      .from('group_challenges')
      .delete()
      .eq('id', challengeId)
      .eq('created_by', currentUserId)

    if (error) {
      console.error(
        'Error borrando desafío:',
        error,
      )

      showToast(
        'No pudimos borrar el desafío.',
      )

      return false
    }

    setChallenges((current) =>
      current.filter(
        (challenge) =>
          challenge.id !== challengeId,
      ),
    )

    return true
  }

  return {
    challenges,
    available,
    createChallenge,
    deleteChallenge,
  }
}
