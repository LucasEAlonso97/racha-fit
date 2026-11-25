import {
  useEffect,
  useState,
} from 'react'

import {
  loadAccountWithRetry,
} from '../lib/account'

import {
  readCache,
  writeCache,
} from '../lib/localCache'

import {
  isNetworkError,
} from '../lib/offlineQueue'

type AccountCache = {
  profile: Profile
  groups: Group[]
}

import type {
  Group,
  Profile,
} from '../types'

/*
 * ========================================
 * CUENTA: PERFIL + GRUPOS + GRUPO ACTIVO
 * ========================================
 *
 * El grupo activo se recuerda en localStorage
 * por usuario.
 */

export function useAccount(
  userId: string,
) {
  const activeGroupStorageKey =
    `racha-active-group-${userId}`

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [groups, setGroups] =
    useState<Group[]>([])

  const [activeGroup, setActiveGroup] =
    useState<Group | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const rememberActiveGroup = (
    group: Group | null,
  ) => {
    if (group) {
      window.localStorage.setItem(
        activeGroupStorageKey,
        group.id,
      )
    } else {
      window.localStorage.removeItem(
        activeGroupStorageKey,
      )
    }
  }

  /*
   * CARGAR PERFIL + GRUPOS
   */

  useEffect(() => {
    let cancelled = false

    const loadAccount = async () => {
      setLoading(true)
      setError(null)

      const cacheKey = `account:${userId}`

      const pickActive = (
        loadedGroups: Group[],
      ) => {
        const savedGroupId =
          window.localStorage.getItem(
            activeGroupStorageKey,
          )

        return (
          loadedGroups.find(
            (group) =>
              group.id === savedGroupId,
          ) ??
          loadedGroups[0] ??
          null
        )
      }

      /*
       * Primero lo guardado en el celu.
       */
      const cached =
        readCache<AccountCache>(cacheKey)

      if (cached) {
        setProfile(cached.profile)
        setGroups(cached.groups)
        setActiveGroup(
          pickActive(cached.groups),
        )
        setLoading(false)
      }

      const {
        profileResult,
        groupsResult,
      } =
        await loadAccountWithRetry(userId)

      if (cancelled) {
        return
      }

      if (
        cached &&
        (profileResult.error ||
          groupsResult.error) &&
        isNetworkError(
          profileResult.error ??
            groupsResult.error,
        )
      ) {
        console.warn(
          'Sin conexión: usando el perfil guardado.',
        )

        return
      }

      if (
        profileResult.error ||
        !profileResult.data
      ) {
        console.error(
          'Error cargando perfil:',
          profileResult.error,
        )

        setError(
          'No pudimos cargar tu perfil.',
        )
        setLoading(false)

        return
      }

      if (groupsResult.error) {
        console.error(
          'Error cargando grupos:',
          groupsResult.error,
        )

        setError(
          'No pudimos cargar tus grupos.',
        )
        setLoading(false)

        return
      }

      setProfile(
        profileResult.data as Profile,
      )

      const loadedGroups =
        (groupsResult.data ??
          []) as Group[]

      setGroups(loadedGroups)

      writeCache(cacheKey, {
        profile:
          profileResult.data as Profile,
        groups: loadedGroups,
      } satisfies AccountCache)

      const groupToActivate =
        pickActive(loadedGroups)

      /*
       * Mismo grupo que ya se mostraba desde
       * lo guardado: no lo reemplazamos (si
       * no, se recargaría todo de nuevo).
       */
      setActiveGroup((current) =>
        current &&
        groupToActivate &&
        current.id === groupToActivate.id
          ? {
              ...current,
              ...groupToActivate,
            }
          : groupToActivate,
      )

      if (groupToActivate) {
        window.localStorage.setItem(
          activeGroupStorageKey,
          groupToActivate.id,
        )
      }

      setLoading(false)
    }

    void loadAccount()

    return () => {
      cancelled = true
    }
  }, [
    userId,
    activeGroupStorageKey,
  ])

  /*
   * CAMBIAR GRUPO ACTIVO
   */

  const activateGroup = (
    group: Group,
  ) => {
    setActiveGroup(group)
    rememberActiveGroup(group)
  }

  /*
   * GRUPO CREADO / UNIDO
   */

  const addOrUpdateGroup = (
    group: Group,
  ) => {
    setGroups((currentGroups) => {
      const alreadyExists =
        currentGroups.some(
          (currentGroup) =>
            currentGroup.id === group.id,
        )

      if (alreadyExists) {
        return currentGroups.map(
          (currentGroup) =>
            currentGroup.id === group.id
              ? group
              : currentGroup,
        )
      }

      return [
        ...currentGroups,
        group,
      ]
    })

    activateGroup(group)
  }

  /*
   * GRUPO EDITADO
   */

  const updateGroup = (
    updatedGroup: Group,
  ) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === updatedGroup.id
          ? updatedGroup
          : group,
      ),
    )

    setActiveGroup((currentGroup) =>
      currentGroup?.id === updatedGroup.id
        ? updatedGroup
        : currentGroup,
    )
  }

  /*
   * GRUPO ABANDONADO:
   * pasa al primero que quede.
   */

  const removeGroup = (
    groupId: string,
  ) => {
    const remainingGroups =
      groups.filter(
        (group) => group.id !== groupId,
      )

    setGroups(remainingGroups)

    const nextGroup =
      remainingGroups[0] ?? null

    setActiveGroup(nextGroup)
    rememberActiveGroup(nextGroup)
  }

  return {
    profile,
    setProfile,
    groups,
    activeGroup,
    loading,
    error,
    activateGroup,
    addOrUpdateGroup,
    updateGroup,
    removeGroup,
  }
}
