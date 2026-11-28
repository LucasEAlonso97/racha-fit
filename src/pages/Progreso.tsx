import {
  useState,
} from 'react'

import Achievements from '../components/Achievements'
import PeriodSummary from '../components/PeriodSummary'
import PersonalStats from '../components/PersonalStats'
import SegmentedTabs from '../components/SegmentedTabs'
import WeeklyProgressChart from '../components/WeeklyProgressChart'
import WrappedBanner from '../components/WrappedBanner'
import YearHeatmap from '../components/YearHeatmap'

import Calendar from './Calendar'

import type {
  ClaimResult,
} from '../hooks/useAchievementClaims'

import type {
  ActivitiesByDate,
  User,
} from '../types'

export type ProgressTab =
  | 'calendar'
  | 'achievements'
  | 'stats'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUser: User
  groupName: string
  today: Date
  tab: ProgressTab
  onChangeTab: (tab: ProgressTab) => void
  onSelectDate: (dateKey: string) => void

  giftsEnabled: boolean
  claimedAchievements: Set<string>
  claimableCount: number
  onClaimAchievement: (
    achievementId: string,
  ) => Promise<ClaimResult>
}

/*
 * ========================================
 * PROGRESO
 * ========================================
 *
 * Todo lo que es "cómo vengo yo":
 * calendario, logros y estadísticas.
 */
function Progreso({
  activities,
  users,
  currentUser,
  groupName,
  today,
  tab,
  onChangeTab,
  onSelectDate,
  giftsEnabled,
  claimedAchievements,
  claimableCount,
  onClaimAchievement,
}: Props) {
  /*
   * Fecha fija mientras la pantalla está
   * abierta (para el gráfico).
   */
  const [chartToday] = useState(
    () => new Date(),
  )

  return (
    <>
      <div className="mx-auto w-full max-w-md px-5 pt-8">
        <h1 className="mb-4 text-3xl font-black text-zinc-800">
          Tu progreso
        </h1>

        <SegmentedTabs
          tabs={[
            {
              id: 'calendar',
              label: 'Calendario',
            },
            {
              id: 'achievements',
              label: 'Logros',
              badge: claimableCount,
            },
            {
              id: 'stats',
              label: 'Números',
            },
          ]}
          active={tab}
          onChange={onChangeTab}
        />
      </div>

      {tab === 'calendar' && (
        <Calendar
          activities={activities}
          users={users}
          currentUserId={currentUser.id}
          today={today}
          onSelectDate={onSelectDate}
          onBack={() => undefined}
          embedded
        />
      )}

      {tab === 'achievements' && (
        <div className="mx-auto w-full max-w-md px-5 pt-5">
          <Achievements
            activities={activities}
            currentUserId={
              currentUser.id
            }
            giftsEnabled={giftsEnabled}
            claimed={claimedAchievements}
            onClaim={onClaimAchievement}
          />
        </div>
      )}

      {tab === 'stats' && (
        <div className="mx-auto w-full max-w-md px-5 pt-5">
          <WrappedBanner
            today={chartToday}
            place="profile"
          />

          <PersonalStats
            activities={activities}
            userId={currentUser.id}
            groupName={groupName}
          />

          <WeeklyProgressChart
            activities={activities}
            user={currentUser}
            today={chartToday}
          />

          <YearHeatmap
            activities={activities}
            userId={currentUser.id}
            today={chartToday}
          />

          <PeriodSummary
            activities={activities}
            users={users}
            currentUserId={
              currentUser.id
            }
            today={today}
          />
        </div>
      )}
    </>
  )
}

export default Progreso
