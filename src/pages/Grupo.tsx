import type {
  ReactNode,
} from 'react'

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
 * ranking (con los desafíos) y torneo.
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

        </div>
      )}
    </>
  )
}

export default Grupo
