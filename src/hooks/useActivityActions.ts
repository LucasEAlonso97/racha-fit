import type {
  Dispatch,
  SetStateAction,
} from 'react'

import {
  deleteActivityPhoto,
  uploadActivityPhoto,
} from '../lib/activityPhotos'

import {
  addActivity,
  findActivityById,
  getUserDayActivities,
  removeActivity,
  replaceActivity,
  setActivityReactions,
  updateActivityById,
  upsertActivity,
} from '../lib/activityState'

import {
  showToast,
} from '../lib/feedback'

import {
  celebrate,
  tapFeedback,
} from '../lib/celebrate'

import {
  enqueueActivity,
  isNetworkError,
  isPendingId,
  removeQueuedActivity,
  updateQueuedActivity,
} from '../lib/offlineQueue'

import {
  cancelCommit,
  scheduleCommit,
  UNDO_MS,
} from '../lib/undoableDelete'

import {
  supabase,
} from '../lib/supabase'

import type {
  ActivitiesByDate,
  Activity,
  ActivityComment,
  ActivityReaction,
  ActivityType,
  Group,
  PhotoChange,
  ReactionEmoji,
} from '../types'

const MAX_COMMENT_LENGTH = 280

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
export function getCreateActivityErrorMessage(
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
   * FOTO
   *
   * Sube la foto nueva (si hay) y devuelve
   * la URL final, o undefined si falló.
   */

  const resolvePhotoUrl = async (
    photo: PhotoChange,
    currentUrl: string | null,
  ) => {
    if (photo.kind === 'keep') {
      return currentUrl
    }

    if (photo.kind === 'remove') {
      return null
    }

    const url =
      await uploadActivityPhoto(
        photo.file,
        activeGroup!.id,
        currentUserId,
      )

    if (!url) {
      showToast(
        'No pudimos subir la foto.',
      )

      return undefined
    }

    return url
  }

  /*
   * EDITAR
   */

  const updateActivity = async (
    dateKey: string,
    activityId: string,
    activity: Activity,
    photo: PhotoChange = {
      kind: 'keep',
    },
  ) => {
    if (!activeGroup) {
      return false
    }

    /*
     * Todavía sin enviar: se cambia en el
     * celu y se manda así cuando vuelva
     * la señal.
     */
    if (isPendingId(activityId)) {
      updateQueuedActivity(activityId, {
        type: activity.type,
        duration: activity.duration,
      })

      setActivities((currentActivities) =>
        updateActivityById(
          currentActivities,
          activityId,
          (current) => ({
            ...current,
            type: activity.type,
            duration: activity.duration,
          }),
        ),
      )

      if (photo.kind !== 'keep') {
        showToast(
          'La foto se puede cambiar cuando la actividad se envíe.',
          'info',
        )
      }

      return true
    }

    const previousPhotoUrl =
      getUserDayActivities(
        activities,
        dateKey,
        currentUserId,
      ).find(
        (current) =>
          current.id === activityId,
      )?.photo_url ?? null

    const photoUrl =
      await resolvePhotoUrl(
        photo,
        previousPhotoUrl,
      )

    if (photoUrl === undefined) {
      return false
    }

    /*
     * photo_url solo se manda si cambió,
     * así editar sin tocar la foto anda
     * aunque la migración no esté.
     */
    const { data, error } =
      await supabase
        .from('activities')
        .update({
          type: activity.type,
          duration: activity.duration,
          ...(photo.kind === 'keep'
            ? {}
            : {
                photo_url: photoUrl,
              }),
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

      if (photo.kind === 'replace') {
        void deleteActivityPhoto(photoUrl)
      }

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
          photo_url: photoUrl,
        },
      ),
    )

    if (
      photo.kind !== 'keep' &&
      previousPhotoUrl
    ) {
      void deleteActivityPhoto(
        previousPhotoUrl,
      )
    }

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
    photo: PhotoChange = {
      kind: 'keep',
    },
  ) => {
    if (!activeGroup) {
      return false
    }

    if (!navigator.onLine) {
      return queueActivity(
        dateKey,
        activity,
        photo.kind === 'replace',
      )
    }

    const photoUrl =
      await resolvePhotoUrl(photo, null)

    if (photoUrl === undefined) {
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
          ...(photoUrl
            ? {
                photo_url: photoUrl,
              }
            : {}),
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

      void deleteActivityPhoto(photoUrl)

      if (isNetworkError(error)) {
        return queueActivity(
          dateKey,
          activity,
          Boolean(photoUrl),
        )
      }

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
      photo_url: photoUrl,
      comments: [],
    }

    setActivities((currentActivities) =>
      addActivity(
        currentActivities,
        dateKey,
        currentUserId,
        newActivity,
      ),
    )

    if (dateKey === todayKey) {
      celebrate()
    }

    if (dateKey < todayKey) {
      await refreshWildcards()
    }

    return true
  }

  /*
   * SIN SEÑAL
   *
   * Solo para el día de hoy: recuperar un
   * día pasado usa un comodín y eso lo
   * tiene que confirmar la base.
   */

  const queueActivity = (
    dateKey: string,
    activity: Activity,
    droppedPhoto: boolean,
  ) => {
    if (!activeGroup) {
      return false
    }

    if (dateKey !== todayKey) {
      showToast(
        'Sin conexión. Para recuperar un día con comodín necesitás internet.',
      )

      return false
    }

    const queued = enqueueActivity({
      userId: currentUserId,
      groupId: activeGroup.id,
      dateKey,
      type: activity.type,
      duration: activity.duration,
    })

    setActivities((currentActivities) =>
      addActivity(
        currentActivities,
        dateKey,
        currentUserId,
        {
          id: queued.pendingId,
          type: activity.type,
          duration: activity.duration,
          reactions: [],
          comments: [],
          photo_url: null,
          pending: true,
        },
      ),
    )

    showToast(
      droppedPhoto
        ? 'Sin señal: guardamos tu actividad (sin la foto) y se envía sola cuando vuelva internet.'
        : 'Sin señal: guardamos tu actividad y se envía sola cuando vuelva internet.',
      'info',
      {
        durationMs: 5000,
      },
    )

    celebrate()

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

    const target =
      findActivityById(
        activities,
        activityId,
      )

    if (!target) {
      return false
    }

    const hide = () =>
      setActivities((currentActivities) =>
        removeActivity(
          currentActivities,
          dateKey,
          currentUserId,
          activityId,
        ),
      )

    const restore = () =>
      setActivities((currentActivities) =>
        upsertActivity(
          currentActivities,
          dateKey,
          currentUserId,
          target,
        ),
      )

    /*
     * Sin enviar todavía: solo se saca de
     * la cola del celu.
     */
    if (isPendingId(activityId)) {
      removeQueuedActivity(activityId)
      hide()

      return true
    }

    const groupId = activeGroup.id

    hide()

    const commitKey = `activity:${activityId}`

    scheduleCommit(commitKey, async () => {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)
        .eq('user_id', currentUserId)
        .eq('group_id', groupId)

      if (error) {
        console.error(
          'Error eliminando actividad:',
          error,
        )

        restore()

        showToast(
          'No pudimos eliminar la actividad.',
        )

        return
      }

      void deleteActivityPhoto(
        target.photo_url,
      )
    })

    showToast(
      'Actividad eliminada',
      'info',
      {
        durationMs: UNDO_MS,
        action: {
          label: 'Deshacer',
          onClick: () => {
            if (cancelCommit(commitKey)) {
              restore()
            }
          },
        },
      },
    )

    return true
  }

  /*
   * COMENTAR
   */

  const addComment = async (
    activityId: string,
    body: string,
  ) => {
    if (isPendingId(activityId)) {
      showToast(
        'Esperá a que la actividad se envíe para comentar.',
        'info',
      )

      return false
    }

    const text = body.trim()

    if (
      !text ||
      text.length > MAX_COMMENT_LENGTH
    ) {
      return false
    }

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: currentUserId,
        body: text,
      })
      .select(
        'id, user_id, body, created_at',
      )
      .single()

    if (error || !data) {
      console.error(
        'Error guardando comentario:',
        error,
      )

      showToast(
        'No pudimos guardar el comentario.',
      )

      return false
    }

    const comment =
      data as ActivityComment

    setActivities((currentActivities) =>
      updateActivityById(
        currentActivities,
        activityId,
        (activity) => ({
          ...activity,
          comments: [
            ...(activity.comments ?? []),
            comment,
          ],
        }),
      ),
    )

    return true
  }

  const deleteComment = async (
    activityId: string,
    commentId: string,
  ) => {
    const comment = findActivityById(
      activities,
      activityId,
    )?.comments?.find(
      (current) =>
        current.id === commentId,
    )

    if (!comment) {
      return
    }

    const setComments = (
      change: (
        comments: ActivityComment[],
      ) => ActivityComment[],
    ) =>
      setActivities((currentActivities) =>
        updateActivityById(
          currentActivities,
          activityId,
          (activity) => ({
            ...activity,
            comments: change(
              activity.comments ?? [],
            ),
          }),
        ),
      )

    const hide = () =>
      setComments((comments) =>
        comments.filter(
          (current) =>
            current.id !== commentId,
        ),
      )

    const restore = () =>
      setComments((comments) =>
        [
          ...comments.filter(
            (current) =>
              current.id !== commentId,
          ),
          comment,
        ].sort((a, b) =>
          a.created_at.localeCompare(
            b.created_at,
          ),
        ),
      )

    hide()

    const commitKey = `comment:${commentId}`

    scheduleCommit(commitKey, async () => {
      const { error } = await supabase
        .from('activity_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUserId)

      if (error) {
        console.error(
          'Error borrando comentario:',
          error,
        )

        restore()

        showToast(
          'No pudimos borrar el comentario.',
        )
      }
    })

    showToast(
      'Comentario borrado',
      'info',
      {
        durationMs: UNDO_MS,
        action: {
          label: 'Deshacer',
          onClick: () => {
            if (cancelCommit(commitKey)) {
              restore()
            }
          },
        },
      },
    )
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
    if (isPendingId(activityId)) {
      showToast(
        'Esperá a que la actividad se envíe para reaccionar.',
        'info',
      )

      return
    }

    const targetActivity =
      findActivityById(
        activities,
        activityId,
      )

    if (!targetActivity) {
      return
    }

    tapFeedback()

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
    addComment,
    deleteComment,
  }
}
