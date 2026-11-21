import {
  useEffect,
  useState,
} from 'react'

import {
  supabase,
} from '../lib/supabase'

export type Trophy = {
  tournament_id: string
  emoji: string
  name: string
  finished_at: string
}

export type TrophyShelf = {
  user_id: string
  count: number
  trophies: Trophy[]
}

/*
 * ========================================
 * VITRINA DE TROFEOS
 * ========================================
 *
 * Torneos ganados por cada integrante del
 * grupo. Si la función todavía no existe
 * (migración sin correr), queda vacía.
 */

export function useTrophyCabinet(
  groupId: string | null,
) {
  const [shelves, setShelves] = useState<
    TrophyShelf[] | null
  >(null)

  useEffect(() => {
    if (!groupId) {
      return
    }

    let cancelled = false

    const load = async () => {
      const { data, error } =
        await supabase.rpc(
          'get_trophy_cabinet',
          {
            p_group_id: groupId,
          },
        )

      if (cancelled) {
        return
      }

      if (error) {
        console.warn(
          'Vitrina no disponible:',
          error.message,
        )

        setShelves([])

        return
      }

      setShelves(
        Array.isArray(data)
          ? (data as TrophyShelf[])
          : [],
      )
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [groupId])

  return shelves
}
