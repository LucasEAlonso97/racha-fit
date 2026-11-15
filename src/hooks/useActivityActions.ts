import type {
  Dispatch,
  SetStateAction,
} from 'react'

import {
  addActivity,
  findActivityById,
  removeActivity,
  replaceActivity,
  setActivityReactions,
} from '../lib/activityState'

import {
  showToast,
} from '../lib/feedback'

import {
  supabase,
} from '../lib/supabase'

import type {
  ActivitiesByDate,
  Activity,
  ActivityReaction,
  ActivityType,
  Group,
  ReactionEmoji,
} from '../types'

type Options = {
  activeGroup: Group | null
  currentUserId: string
  todayKey: string
  activities: ActivitiesByDate
  setActivities: Dispatch<
    SetStateAction<ActivitiesByDate>
  >
  refreshWildcards: () => Promise<unknown>
}

/*
 * Traduce los errores de la base al crear
 * una actividad a un mensaje para el usuario.
 */
function getCreateActivityErrorMessage(
  message: string | undefined,
) {
  const errorMessage =
    (message ?? '').toLowerCase()

  if (
    errorMessage.includes('no_wildcards')
  ) {
    return 'No te quedan comodines disponibles.'
  }

  if (
    errorMessage.includes(
      'últimos 7 días',
    ) ||
    errorMessage.includes(
      'ultimos 7 dias',
    )
  ) {
    return 'Solo podés recuperar actividades de los últimos 7 días.'
  }

  if (errorMessage.includes('futura')) {
    return 'No se pueden registrar actividades futuras.'
  }

  return 'No pudimos guardar la actividad.'
}

/*
 * ========================================
 * ACCIONES SOBRE ACTIVIDADES Y REACCIONES
 * ========================================
 *
 * Cada acción devuelve true si salió bien,
 * para que quien la llama sepa si cerrar
 * el modal.
 */

export function useActivityActions({
  activeGroup,
  currentUserId,
  todayKey,
  activities,
  setActivities,
  refreshWildcards,
}: Options) {
  /*
   * EDITAR
   */

  const updateActivity = async (
    dateKey: string,
    activityId: string,
    activity: Activity,
  ) => {
    if (!activeGroup) {
      return false
    }

    const { data, error } =
      await supabase
        .from('activities')
        .update({
          type: activity.type,
          duration: activity.duration,
        })
        .eq('id', activityId)
        .eq('user_id', currentUserId)
        .eq('group_id', activeGroup.id)
        .select(
          'id, type, duration, recovered_with_wildcard',
        )
        .single()

    if (error || !data) {
      console.error(
        'Error editando actividad:',
        error,
      )

      showToast(
        'No pudimos editar la actividad.',
      )

      return false
    }

    setActivities((currentActivities) =>
      replaceActivity(
        currentActivities,
        dateKey,
        currentUserId,
        activityId,
        {
          id: data.id,
          type: data.type as ActivityType,
          duration: data.duration,
          recovered_with_wildcard:
            data.recovered_with_wildcard,
        },
      ),
    )

    return true
  }

  /*
   * NUEVA
   *
   * Si la fecha es pasada, la base consume
   * un comodín: refrescamos el saldo.
   */

  const createActivity = async (
    dateKey: string,
    activity: Activity,
  ) => {
    if (!activeGroup) {
      return false
    }

    const { data, error } =
      await supabase
        .from('activities')
        .insert({
          user_id: currentUserId,
          group_id: activeGroup.id,
          activity_date: dateKey,
          type: activity.type,
          duration: activity.duration,
        })
        .select(
          'id, type, duration, recovered_with_wildcard',
        )
        .single()

    if (error || !data) {
      console.error(
        'Error guardando actividad:',
        error,
      )

      showToast(
        getCreateActivityErrorMessage(
          error?.message,
        ),
      )

      return false
    }

    const newActivity: Activity = {
      id: data.id,
      type: data.type as ActivityType,
      duration: data.duration,
      recovered_with_wildcard:
        data.recovered_with_wildcard,
      reactions: [],
    }

    setActivities((currentActivities) =>
      addActivity(
        currentActivities,
        dateKey,
        currentUserId,
        newActivity,
      ),
    )

    if (dateKey < todayKey) {
      await refreshWildcards()
    }

    return true
  }

  /*
   * ELIMINAR
   */

  const deleteActivity = async (
    dateKey: string,
    activityId: string,
  ) => {
    if (!activeGroup) {
      return false
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', currentUserId)
      .eq('group_id', activeGroup.id)

    if (error) {
      console.error(
        'Error eliminando actividad:',
        error,
      )

      showToast(
        'No pudimos eliminar la actividad.',
      )

      return false
    }

    setActivities((currentActivities) =>
      removeActivity(
        currentActivities,
        dateKey,
        currentUserId,
        activityId,
      ),
    )

    return true
  }

  /*
   * REACCIONAR
   *
   * Tocar la misma reacción la quita;
   * otra distinta la reemplaza.
   */

  const reactToActivity = async (
    activityId: string,
    emoji: ReactionEmoji,
  ) => {
    const targetActivity =
      findActivityById(
        activities,
        activityId,
      )

    if (!targetActivity) {
      return
    }

    const currentReactions =
      targetActivity.reactions ?? []

    const othersReactions =
      currentReactions.filter(
        (reaction) =>
          reaction.user_id !==
          currentUserId,
      )

    const myReaction =
      currentReactions.find(
        (reaction) =>
          reaction.user_id ===
          currentUserId,
      )

    const applyReactions = (
      reactions: ActivityReaction[],
    ) => {
      setActivities((currentActivities) =>
        setActivityReactions(
          currentActivities,
          activityId,
          reactions,
        ),
      )
    }

    /*
     * MISMA REACCIÓN: QUITAR
     */

    if (myReaction?.emoji === emoji) {
      const { error } = await supabase
        .from('activity_reactions')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', currentUserId)

      if (error) {
        console.error(
          'Error eliminando reacción:',
          error,
        )

        showToast(
          'No pudimos sacar la reacción.',
        )

        return
      }

      applyReactions(othersReactions)

      return
    }

    /*
     * NUEVA / CAMBIO
     */

    const { data, error } = await supabase
      .from('activity_reactions')
      .upsert(
        {
          activity_id: activityId,
          user_id: currentUserId,
          emoji,
        },
        {
          onConflict:
            'activity_id,user_id',
        },
      )
      .select('user_id, emoji')
      .single()

    if (error || !data) {
      console.error(
        'Error guardando reacción:',
        error,
      )

      showToast(
        'No pudimos guardar la reacción.',
      )

      return
    }

    applyReactions([
      ...othersReactions,
      {
        user_id: data.user_id,
        emoji: data.emoji as ReactionEmoji,
      },
    ])
  }

  return {
    createActivity,
    updateActivity,
    deleteActivity,
    reactToActivity,
  }
}
