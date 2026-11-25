import type {
  Dispatch,
  SetStateAction,
} from 'react'

import {
  clearAllCaches,
} from '../lib/localCache'

import {
  getNameFallback,
} from '../lib/groupData'

import {
  showToast,
} from '../lib/feedback'

import {
  supabase,
} from '../lib/supabase'

import type {
  Group,
  Profile,
  User,
} from '../types'

type Options = {
  activeGroup: Group | null
  currentUserId: string
  setProfile: Dispatch<
    SetStateAction<Profile | null>
  >
  setUsers: Dispatch<
    SetStateAction<User[]>
  >
}

/*
 * ========================================
 * ACCIONES DEL PERFIL PROPIO
 * ========================================
 *
 * Objetivo semanal, nombre/avatar,
 * onboarding y logout.
 */

export function useProfileActions({
  activeGroup,
  currentUserId,
  setProfile,
  setUsers,
}: Options) {
  const updateCurrentUser = (
    changes: Partial<User>,
  ) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === currentUserId
          ? {
              ...user,
              ...changes,
            }
          : user,
      ),
    )
  }

  /*
   * OBJETIVO SEMANAL
   */

  const updateWeeklyGoal = async (
    weeklyGoal: number,
  ) => {
    if (!activeGroup) {
      return false
    }

    const { data, error } =
      await supabase.rpc(
        'set_my_weekly_goal',
        {
          p_group_id: activeGroup.id,
          p_weekly_goal: weeklyGoal,
        },
      )

    if (error) {
      console.error(
        'Error actualizando objetivo semanal:',
        error,
      )

      showToast(
        'No pudimos cambiar tu objetivo semanal.',
      )

      return false
    }

    updateCurrentUser({
      weeklyGoal: Number(
        data ?? weeklyGoal,
      ),
    })

    return true
  }

  /*
   * NOMBRE + AVATAR
   */

  const saveProfile = async (
    name: string,
    avatarUrl: string | null,
    avatarFile: File | null,
  ) => {
    let finalAvatarUrl = avatarUrl

    if (avatarFile) {
      const avatarPath =
        `${currentUserId}/avatar`

      const { error: uploadError } =
        await supabase.storage
          .from('avatars')
          .upload(
            avatarPath,
            avatarFile,
            {
              upsert: true,
              contentType: avatarFile.type,
              cacheControl: '3600',
            },
          )

      if (uploadError) {
        console.error(
          'Error subiendo avatar:',
          uploadError,
        )

        showToast(
          'No pudimos subir tu dibu.',
        )

        return false
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarPath)

      /*
       * ?v= fuerza a refrescar la imagen
       * cacheada.
       */
      finalAvatarUrl =
        `${publicUrlData.publicUrl}?v=${Date.now()}`
    }

    const { data, error } =
      await supabase
        .from('profiles')
        .update({
          name,
          avatar_url: finalAvatarUrl,
        })
        .eq('id', currentUserId)
        .select(
          'id, name, avatar_url, onboarding_completed',
        )
        .single()

    if (error || !data) {
      console.error(
        'Error actualizando perfil:',
        error,
      )

      showToast(
        'No pudimos guardar tu perfil.',
      )

      return false
    }

    const updatedProfile =
      data as Profile

    setProfile(updatedProfile)

    updateCurrentUser({
      name: updatedProfile.name,
      avatar: updatedProfile.avatar_url,
      fallback: getNameFallback(
        updatedProfile.name,
      ),
    })

    return true
  }

  /*
   * COMPLETAR ONBOARDING
   */

  const completeOnboarding =
    async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
        })
        .eq('id', currentUserId)

      if (error) {
        console.error(
          'Error completando onboarding:',
          error,
        )

        showToast(
          'No pudimos terminar la introducción. Probá nuevamente.',
        )

        return
      }

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              onboarding_completed: true,
            }
          : currentProfile,
      )
    }

  /*
   * LOGOUT
   */

  const logout = async () => {
    /*
     * Lo guardado en el celu es de esta
     * cuenta: se borra al salir.
     */
    clearAllCaches()

    const { error } =
      await supabase.auth.signOut()

    if (error) {
      console.error(
        'Error cerrando sesión:',
        error,
      )
    }
  }

  return {
    updateWeeklyGoal,
    saveProfile,
    completeOnboarding,
    logout,
  }
}
