import {
  useState,
} from 'react'

import {
  getUserDayActivities,
} from '../lib/activityState'

import type {
  ActivitiesByDate,
} from '../types'

type Options = {
  todayKey: string
  currentUserId: string
  activities: ActivitiesByDate
  wildcardRecoveryDates: string[]
}

/*
 * ========================================
 * ESTADO DEL MODAL DE ACTIVIDAD
 * ========================================
 *
 * Qué día y qué actividad se está
 * creando/editando, y si guardarla
 * gastaría un comodín.
 */

export function useActivityModal({
  todayKey,
  currentUserId,
  activities,
  wildcardRecoveryDates,
}: Options) {
  const [editingDate, setEditingDate] =
    useState(todayKey)

  const [
    editingActivityId,
    setEditingActivityId,
  ] =
    useState<string | null>(null)

  const [isOpen, setIsOpen] =
    useState(false)

  const open = (
    dateKey = todayKey,
    activityId: string | null = null,
  ) => {
    setEditingDate(dateKey)
    setEditingActivityId(activityId)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setEditingActivityId(null)
  }

  const editingDayActivities =
    getUserDayActivities(
      activities,
      editingDate,
      currentUserId,
    )

  const editingActivity =
    editingActivityId
      ? editingDayActivities.find(
          (activity) =>
            activity.id ===
            editingActivityId,
        )
      : undefined

  /*
   * Gasta comodín si es una actividad nueva
   * en un día pasado que no tenía nada
   * y que no se había recuperado antes.
   */
  const usesWildcard =
    editingDate < todayKey &&
    !editingActivityId &&
    editingDayActivities.length === 0 &&
    !wildcardRecoveryDates.includes(
      editingDate,
    )

  return {
    isOpen,
    editingDate,
    editingActivityId,
    editingActivity,
    usesWildcard,
    open,
    close,
  }
}
