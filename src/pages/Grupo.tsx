import type {
  ReactNode,
} from 'react'

import GroupHistoryPanel from '../components/GroupHistoryPanel'
import RankingPanel from '../components/RankingPanel'
import SegmentedTabs from '../components/SegmentedTabs'

import Torneos from './Torneos'

import type {
  ActivitiesByDate,
  Group,
  User,
} from '../types'

export type GroupTab =
  | 'ranking'
  | 'tournament'
  | 'history'

type Props = {
  group: Group
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
  tab: GroupTab
  onChangeTab: (tab: GroupTab) => void

  /*
   * Desafíos del grupo (los arma RachaApp,
   * que tiene los datos).
   */
  challenges?: ReactNode
}

/*
 * ========================================
 * GRUPO
 * ========================================
 *
 * Todo lo que es "yo contra mis amigos":
 * ranking (con los desafíos), torneo e
 * historial del grupo.
 */
function Grupo({
  group,
  activities,
  users,
  currentUserId,
  today,
  tab,
  onChangeTab,
  challenges,
}: Props) {
  return (
    <>
      <div className="mx-auto w-full max-w-md px-5 pt-8">
        <h1 className="mb-4 truncate text-3xl font-black text-zinc-800">
          {group.name}
        </h1>

        <SegmentedTabs
          tabs={[
            {
              id: 'ranking',
              label: 'Ranking',
            },
            {
              id: 'tournament',
              label: 'Torneo',
            },
            {
              id: 'history',
              label: 'Historial',
            },
          ]}
          active={tab}
          onChange={onChangeTab}
        />
      </div>

      {tab === 'tournament' ? (
        <Torneos
          group={group}
          users={users}
          currentUserId={currentUserId}
          embedded
        />
      ) : (
        <div className="mx-auto w-full max-w-md px-5 pt-5">
          {tab === 'ranking' && (
            <>
              {challenges}

              <RankingPanel
                activities={activities}
                users={users}
                currentUserId={
                  currentUserId
                }
                today={today}
              />
            </>
          )}

          {tab === 'history' && (
            <GroupHistoryPanel
              groupId={group.id}
            />
          )}
        </div>
      )}
    </>
  )
}

export default Grupo
