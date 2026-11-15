import {
  useMemo,
  useState,
} from 'react'

import type {
  Session,
} from '@supabase/supabase-js'

import ActivityModal from './components/ActivityModal'
import BottomNavigation from './components/BottomNavigation'
import DayDetailModal from './components/DayDetailModal'
import GroupHeader from './components/GroupHeader'
import {
  ErrorScreen,
  LoadingScreen,
} from './components/StatusScreen'

import Calendar from './pages/Calendar'
import GroupSetup from './pages/GroupSetup'
import Home from './pages/Home'
import InviteJoin from './pages/InviteJoin'
import Onboarding from './pages/Onboarding'
import Perfil from './pages/Perfil'
import Rachas from './pages/Rachas'
import Torneos from './pages/Torneos'

import {
  useAccount,
} from './hooks/useAccount'

import {
  useActivityActions,
} from './hooks/useActivityActions'

import {
  useActivityModal,
} from './hooks/useActivityModal'

import {
  useGroupData,
} from './hooks/useGroupData'

import {
  useInviteLink,
} from './hooks/useInviteLink'

import {
  useProfileActions,
} from './hooks/useProfileActions'

import {
  useSocialNotifications,
} from './hooks/useSocialNotifications'

import {
  useWildcards,
} from './hooks/useWildcards'

import {
  formatDateKey,
} from './utils/date'

import type {
  Activity,
  Group,
  PhotoChange,
  View,
} from './types'

type Props = {
  session: Session
}

/*
 * ========================================
 * RACHA APP
 * ========================================
 *
 * Junta las piezas: la lógica vive en los
 * hooks y acá solo se decide qué pantalla
 * mostrar y se conectan los eventos.
 */

function RachaApp({
  session,
}: Props) {
  /*
   * FECHA
   */

  const today = useMemo(
    () => new Date(),
    [],
  )

  const todayKey =
    formatDateKey(today)

  const currentUserId =
    session.user.id

  /*
   * ESTADO
   */

  const account =
    useAccount(currentUserId)

  const {
    profile,
    groups,
    activeGroup,
  } = account

  const invite = useInviteLink()

  const groupData = useGroupData(
    activeGroup,
    currentUserId,
  )

  const {
    users,
    activities,
  } = groupData

  const {
    balance: wildcardBalance,
    recoveredDates:
      wildcardRecoveryDates,
    refresh: refreshWildcards,
  } = useWildcards(currentUserId)

  const {
    notifications: socialNotifications,
    unreadCount: socialUnreadCount,
    loading: socialNotificationsLoading,
    markAllRead:
      markSocialNotificationsRead,
  } = useSocialNotifications({
    userId: currentUserId,
    groupId: activeGroup?.id ?? '',
  })

  const [view, setView] =
    useState<View>('home')

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null)

  const activityModal =
    useActivityModal({
      todayKey,
      currentUserId,
      activities,
      wildcardRecoveryDates,
    })

  /*
   * ACCIONES
   */

  const activityActions =
    useActivityActions({
      activeGroup,
      currentUserId,
      todayKey,
      activities,
      setActivities:
        groupData.setActivities,
      refreshWildcards,
    })

  const profileActions =
    useProfileActions({
      activeGroup,
      currentUserId,
      setProfile: account.setProfile,
      setUsers: groupData.setUsers,
    })

  const currentUser = users.find(
    (user) => user.id === currentUserId,
  )

  /*
   * ========================================
   * HANDLERS
   * ========================================
   */

  const selectGroup = (
    group: Group,
  ) => {
    if (activeGroup?.id === group.id) {
      return
    }

    setSelectedDate(null)
    activityModal.close()
    groupData.setError(null)
    groupData.clear()
    account.activateGroup(group)
  }

  const handleLeftGroup = (
    groupId: string,
  ) => {
    account.removeGroup(groupId)
    groupData.clear()
    setSelectedDate(null)
  }

  const openActivityModal = (
    dateKey = todayKey,
    activityId: string | null = null,
  ) => {
    setSelectedDate(null)
    activityModal.open(
      dateKey,
      activityId,
    )
  }

  const saveActivity = async (
    activity: Activity,
    photo: PhotoChange,
  ) => {
    const {
      editingDate,
      editingActivityId,
    } = activityModal

    const saved = editingActivityId
      ? await activityActions.updateActivity(
          editingDate,
          editingActivityId,
          activity,
          photo,
        )
      : await activityActions.createActivity(
          editingDate,
          activity,
          photo,
        )

    if (saved) {
      activityModal.close()
    }
  }

  const deleteActivity = async () => {
    const {
      editingDate,
      editingActivityId,
    } = activityModal

    if (!editingActivityId) {
      return
    }

    const deleted =
      await activityActions.deleteActivity(
        editingDate,
        editingActivityId,
      )

    if (deleted) {
      activityModal.close()
    }
  }

  /*
   * ========================================
   * PANTALLAS PREVIAS A LA APP
   * ========================================
   */

  if (account.loading) {
    return (
      <LoadingScreen message="Cargando Racha..." />
    )
  }

  if (account.error || !profile) {
    return (
      <ErrorScreen
        title="Algo salió mal"
        message={
          account.error ??
          'No pudimos cargar tu cuenta.'
        }
        actionLabel="Volver al login"
        onAction={profileActions.logout}
      />
    )
  }

  if (!profile.onboarding_completed) {
    return (
      <Onboarding
        onComplete={
          profileActions.completeOnboarding
        }
      />
    )
  }

  if (invite.code) {
    const existingInvitedGroup =
      groups.find(
        (group) =>
          group.invite_code.toUpperCase() ===
          invite.code,
      ) ?? null

    return (
      <InviteJoin
        inviteCode={invite.code}
        existingGroup={
          existingInvitedGroup
        }
        onReady={(group) => {
          account.addOrUpdateGroup(group)
          invite.clear()
        }}
        onCancel={invite.clear}
      />
    )
  }

  if (!activeGroup) {
    return (
      <GroupSetup
        userId={currentUserId}
        userName={profile.name}
        onReady={account.addOrUpdateGroup}
        onLogout={profileActions.logout}
      />
    )
  }

  if (groupData.loading) {
    return (
      <LoadingScreen
        message={`Cargando ${activeGroup.name}...`}
      />
    )
  }

  if (groupData.error) {
    return (
      <ErrorScreen
        title="No pudimos cargar tu Racha"
        message={groupData.error}
        actionLabel="Reintentar"
        onAction={() =>
          window.location.reload()
        }
      />
    )
  }

  /*
   * ========================================
   * APP
   * ========================================
   */

  return (
    <main className="min-h-screen pb-28">
      <GroupHeader
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={selectGroup}
        onLogout={profileActions.logout}
      />

      {view === 'home' && (
        <Home
          groupId={activeGroup.id}
          activities={activities}
          users={users}
          currentUserId={currentUserId}
          today={today}
          onSelectDate={setSelectedDate}
          onAddActivity={() =>
            openActivityModal(todayKey)
          }
          onReactActivity={
            activityActions.reactToActivity
          }
          socialNotifications={
            socialNotifications
          }
          socialUnreadCount={
            socialUnreadCount
          }
          socialNotificationsLoading={
            socialNotificationsLoading
          }
          onMarkSocialNotificationsRead={
            markSocialNotificationsRead
          }
        />
      )}

      {view === 'calendar' && (
        <Calendar
          activities={activities}
          users={users}
          currentUserId={currentUserId}
          today={today}
          onSelectDate={setSelectedDate}
          onBack={() => setView('home')}
        />
      )}

      {view === 'rachas' && (
        <Rachas
          groupId={activeGroup.id}
          activities={activities}
          users={users}
          currentUserId={currentUserId}
          today={today}
        />
      )}

      {view === 'tournaments' && (
        <Torneos
          group={activeGroup}
          users={users}
          currentUserId={currentUserId}
        />
      )}

      {view === 'profile' &&
        currentUser && (
          <Perfil
            currentUser={currentUser}
            profile={profile}
            email={
              session.user.email ?? ''
            }
            group={activeGroup}
            members={users}
            memberCount={users.length}
            wildcardBalance={
              wildcardBalance
            }
            activities={activities}
            onSaveWeeklyGoal={
              profileActions.updateWeeklyGoal
            }
            onLogout={
              profileActions.logout
            }
            onSaveProfile={
              profileActions.saveProfile
            }
            onGroupReady={
              account.addOrUpdateGroup
            }
            onGroupUpdated={
              account.updateGroup
            }
            onLeftGroup={handleLeftGroup}
            onMemberRemoved={
              groupData.removeMember
            }
          />
        )}

      <BottomNavigation
        view={view}
        onChangeView={setView}
        onAddActivity={() =>
          openActivityModal(todayKey)
        }
      />

      <DayDetailModal
        dateKey={selectedDate}
        todayKey={todayKey}
        activities={activities}
        users={users}
        currentUserId={currentUserId}
        wildcardBalance={wildcardBalance}
        wildcardRecoveryDates={
          wildcardRecoveryDates
        }
        onClose={() =>
          setSelectedDate(null)
        }
        onEditActivity={
          openActivityModal
        }
        onReactActivity={
          activityActions.reactToActivity
        }
        onAddComment={
          activityActions.addComment
        }
        onDeleteComment={
          activityActions.deleteComment
        }
      />

      <ActivityModal
        open={activityModal.isOpen}
        activity={
          activityModal.editingActivity
        }
        dateKey={
          activityModal.editingDate
        }
        todayKey={todayKey}
        usesWildcard={
          activityModal.usesWildcard
        }
        wildcardBalance={wildcardBalance}
        onClose={activityModal.close}
        onSave={saveActivity}
        onDelete={deleteActivity}
      />
    </main>
  )
}

export default RachaApp
