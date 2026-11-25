import {
  lazy,
  Suspense,
  useSyncExternalStore,
} from 'react'

import {
  retryImport,
} from '../lib/appVersion'

import GroupGalleryModal from './GroupGalleryModal'
import MemberProfileModal from './MemberProfileModal'

/*
 * El Wrapped se usa poco: se baja recién
 * cuando alguien lo abre.
 */
const WrappedStories = lazy(() =>
  retryImport(() => import('./WrappedStories')),
)

import {
  closeSocialPanel,
  getSocialPanel,
  subscribeSocialPanel,
} from '../lib/socialPanels'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  groupId: string
  groupName: string
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

/*
 * Dibuja el perfil de un integrante o la
 * galería cuando alguien los abre con
 * openMemberProfile / openGroupGallery.
 */
function SocialPanelsHost({
  groupId,
  groupName,
  activities,
  users,
  currentUserId,
  today,
}: Props) {
  const panel = useSyncExternalStore(
    subscribeSocialPanel,
    getSocialPanel,
  )

  if (!panel) {
    return null
  }

  if (panel.kind === 'wrapped') {
    return (
      <Suspense fallback={null}>
        <WrappedStories
          year={panel.year}
          groupId={groupId}
          groupName={groupName}
          activities={activities}
          users={users}
          currentUserId={currentUserId}
          onClose={closeSocialPanel}
        />
      </Suspense>
    )
  }

  if (panel.kind === 'gallery') {
    return (
      <GroupGalleryModal
        groupName={groupName}
        activities={activities}
        users={users}
        currentUserId={currentUserId}
        onClose={closeSocialPanel}
      />
    )
  }

  const user = users.find(
    (member) =>
      member.id === panel.userId,
  )

  if (!user) {
    return null
  }

  return (
    <MemberProfileModal
      groupId={groupId}
      user={user}
      activities={activities}
      users={users}
      currentUserId={currentUserId}
      today={today}
      onClose={closeSocialPanel}
    />
  )
}

export default SocialPanelsHost
