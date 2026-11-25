import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  retryImport,
} from './lib/appVersion'

import type {
  Session,
} from '@supabase/supabase-js'

import ActivityModal from './components/ActivityModal'
import BottomNavigation from './components/BottomNavigation'
import ChallengesSection from './components/ChallengesSection'
import DayDetailModal from './components/DayDetailModal'
import GroupHeader from './components/GroupHeader'
import InstallBanner from './components/InstallBanner'
import MegaphoneBanner from './components/MegaphoneBanner'
import MilestoneCelebration from './components/MilestoneCelebration'
import SocialPanelsHost from './components/SocialPanelsHost'
import TurnReminderModal from './components/TurnReminderModal'
import ConsistencyRewardModal from './components/ConsistencyRewardModal'
import WhatsNewModal from './components/WhatsNewModal'
import {
  ErrorScreen,
  LoadingScreen,
  PageSkeleton,
} from './components/StatusScreen'

import Home from './pages/Home'

/*
 * Pantallas que no se ven al abrir la app:
 * se descargan recién cuando hacen falta.
 */
const Calendar = lazy(() =>
  retryImport(() => import('./pages/Calendar')),
)
const GroupSetup = lazy(() =>
  retryImport(() => import('./pages/GroupSetup')),
)
const InviteJoin = lazy(() =>
  retryImport(() => import('./pages/InviteJoin')),
)
const Onboarding = lazy(() =>
  retryImport(() => import('./pages/Onboarding')),
)
const Perfil = lazy(() =>
  retryImport(() => import('./pages/Perfil')),
)
const Rachas = lazy(() =>
  retryImport(() => import('./pages/Rachas')),
)
const Torneos = lazy(() =>
  retryImport(() => import('./pages/Torneos')),
)

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
  useOfflineSync,
} from './hooks/useOfflineSync'

import {
  useChallenges,
} from './hooks/useChallenges'

import {
  useGroupData,
} from './hooks/useGroupData'

import {
  useLoadGroupPerks,
} from './hooks/useGroupPerks'

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
  claimReferral,
} from './lib/referrals'

import {
  closeSocialPanel,
} from './lib/socialPanels'

import {
  markWhatsNewSeen,
  shouldShowWhatsNew,
} from './lib/whatsNew'

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
   * Aviso de errores: asociar el id del
   * usuario (sin nombre ni mail).
   */
  useEffect(() => {
    if (!import.meta.env.VITE_SENTRY_DSN) {
      return
    }

    void import('./lib/monitoring').then(
      ({ setMonitoringUser }) =>
        setMonitoringUser(currentUserId),
    )
  }, [currentUserId])

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

  useLoadGroupPerks(
    activeGroup?.id ?? null,
  )

  const groupChallenges =
    useChallenges(
      activeGroup?.id ?? null,
      currentUserId,
    )

  const {
    balance: wildcardBalance,
    consistencyRun,
    consistencyAtCap,
    justEarned: consistencyEarned,
    dismissJustEarned:
      dismissConsistencyEarned,
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

  const [showWhatsNew, setShowWhatsNew] =
    useState(shouldShowWhatsNew)

  const closeWhatsNew = () => {
    markWhatsNewSeen()
    setShowWhatsNew(false)
  }

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null)

  /*
   * Al abrir un día viejo se completan sus
   * comentarios (ver lib/groupData.ts).
   */
  const { loadDayDetails } = groupData

  useEffect(() => {
    if (selectedDate) {
      void loadDayDetails(selectedDate)
    }
  }, [selectedDate, loadDayDetails])

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

  /*
   * Actividades guardadas sin señal: se
   * muestran y se envían al volver internet.
   */
  useOfflineSync({
    userId: currentUserId,
    activeGroupId:
      activeGroup?.id ?? null,
    ready:
      Boolean(activeGroup) &&
      !groupData.loading &&
      !groupData.error,
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
    closeSocialPanel()
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
      <Suspense
        fallback={
          <LoadingScreen message="Cargando..." />
        }
      >
        <Onboarding
          onComplete={async () => {
            /*
             * Quien recién empieza no
             * necesita ver "novedades".
             */
            markWhatsNewSeen()
            setShowWhatsNew(false)

            await profileActions.completeOnboarding()
          }}
        />
      </Suspense>
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
      <Suspense
        fallback={
          <LoadingScreen message="Cargando..." />
        }
      >
        <InviteJoin
          inviteCode={invite.code}
          existingGroup={
            existingInvitedGroup
          }
          onReady={(group) => {
            account.addOrUpdateGroup(group)

            /*
             * Premio por invitar: anota
             * quién te invitó. La base
             * decide si corresponde
             * (cuenta nueva, sin
             * actividades...).
             */
            if (invite.ref) {
              void claimReferral(
                invite.ref,
                group.id,
              )
            }

            invite.clear()
          }}
          onCancel={invite.clear}
        />
      </Suspense>
    )
  }

  if (!activeGroup) {
    return (
      <Suspense
        fallback={
          <LoadingScreen message="Cargando..." />
        }
      >
        <GroupSetup
          userId={currentUserId}
          userName={profile.name}
          onReady={account.addOrUpdateGroup}
          onLogout={profileActions.logout}
        />
      </Suspense>
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
    <main className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <GroupHeader
        groups={groups}
        activeGroup={activeGroup}
        onSelectGroup={selectGroup}
        onLogout={profileActions.logout}
      />

      {view === 'home' && (
        <MegaphoneBanner
          users={users}
          currentUserId={currentUserId}
        />
      )}

      {view === 'home' && (
        <InstallBanner />
      )}

      {view === 'home' &&
        groupChallenges.available && (
          <ChallengesSection
            challenges={
              groupChallenges.challenges
            }
            activities={activities}
            users={users}
            currentUserId={currentUserId}
            today={today}
            onCreate={
              groupChallenges.createChallenge
            }
            onDelete={
              groupChallenges.deleteChallenge
            }
          />
        )}

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

      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-md px-5 pt-8">
            <PageSkeleton />
          </div>
        }
      >
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
              consistencyRun={
                consistencyRun
              }
              consistencyAtCap={
                consistencyAtCap
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
      </Suspense>

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
        lastActivity={
          activityModal.lastActivity
        }
        onClose={activityModal.close}
        onSave={saveActivity}
        onDelete={deleteActivity}
      />

      {showWhatsNew && (
        <WhatsNewModal
          onClose={closeWhatsNew}
        />
      )}

      {!showWhatsNew &&
        view !== 'tournaments' && (
          <TurnReminderModal
            key={activeGroup.id}
            groupId={activeGroup.id}
            currentUserId={currentUserId}
            onGoToTournaments={() =>
              setView('tournaments')
            }
          />
        )}

      {!showWhatsNew &&
        consistencyEarned > 0 && (
          <ConsistencyRewardModal
            count={consistencyEarned}
            onClose={
              dismissConsistencyEarned
            }
          />
        )}

      {!showWhatsNew && currentUser && (
        <MilestoneCelebration
          user={currentUser}
          groupId={activeGroup.id}
          groupName={activeGroup.name}
          activities={activities}
          today={today}
        />
      )}

      <SocialPanelsHost
        groupId={activeGroup.id}
        groupName={activeGroup.name}
        activities={activities}
        users={users}
        currentUserId={currentUserId}
        today={today}
      />
    </main>
  )
}

export default RachaApp
