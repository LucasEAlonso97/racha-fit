import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'

import {
  getPerksState,
  setPerksState,
  subscribePerks,
} from '../lib/groupPerks'

import {
  supabase,
} from '../lib/supabase'

/*
 * ========================================
 * CARGA DE CORONAS / APODOS / MEGÁFONO
 * ========================================
 *
 * Se monta una vez (RachaApp) por grupo.
 * Si las tablas no existen todavía
 * (migración sin correr), queda todo
 * vacío y no pasa nada.
 *
 * Se recarga en tiempo real y cada 5
 * minutos (para que lo vencido
 * desaparezca solo).
 */

const RELOAD_EVERY_MS = 5 * 60 * 1000

export function useLoadGroupPerks(
  groupId: string | null,
) {
  const [reloadKey, setReloadKey] =
    useState(0)

  useEffect(() => {
    if (!groupId) {
      setPerksState({
        crowned: new Set(),
        nicknames: new Map(),
        banner: null,
      })

      return
    }

    let cancelled = false

    const load = async () => {
      const now = new Date().toISOString()

      const [perksResult, bannerResult] =
        await Promise.all([
          supabase
            .from('group_member_perks')
            .select(
              'user_id, kind, value, created_at',
            )
            .eq('group_id', groupId)
            .gt('expires_at', now)
            .order('created_at', {
              ascending: true,
            }),

          supabase
            .from('group_banners')
            .select(
              'id, user_id, message, expires_at',
            )
            .eq('group_id', groupId)
            .gt('expires_at', now)
            .order('created_at', {
              ascending: false,
            })
            .limit(1),
        ])

      if (cancelled) {
        return
      }

      const crowned = new Set<string>()
      const nicknames = new Map<
        string,
        string
      >()

      if (!perksResult.error) {
        ;(perksResult.data ?? []).forEach(
          (perk) => {
            if (perk.kind === 'crown') {
              crowned.add(perk.user_id)
            }

            if (
              perk.kind === 'nickname' &&
              perk.value
            ) {
              /*
               * Viene ordenado: el más
               * nuevo pisa al anterior.
               */
              nicknames.set(
                perk.user_id,
                perk.value,
              )
            }
          },
        )
      }

      const bannerRow =
        !bannerResult.error
          ? bannerResult.data?.[0]
          : undefined

      setPerksState({
        crowned,
        nicknames,
        banner: bannerRow
          ? {
              id: bannerRow.id,
              userId: bannerRow.user_id,
              message: bannerRow.message,
              expiresAt:
                bannerRow.expires_at,
            }
          : null,
      })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [groupId, reloadKey])

  useEffect(() => {
    if (!groupId) {
      return
    }

    const reload = () =>
      setReloadKey(
        (current) => current + 1,
      )

    const channel = supabase
      .channel(`racha-perks-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_member_perks',
          filter: `group_id=eq.${groupId}`,
        },
        reload,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_banners',
          filter: `group_id=eq.${groupId}`,
        },
        reload,
      )
      .subscribe()

    const interval = window.setInterval(
      reload,
      RELOAD_EVERY_MS,
    )

    return () => {
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [groupId])
}

export function useGroupPerks() {
  return useSyncExternalStore(
    subscribePerks,
    getPerksState,
  )
}
