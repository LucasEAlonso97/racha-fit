import {
  useSyncExternalStore,
} from 'react'

import GroupGalleryModal from './GroupGalleryModal'
import MemberProfileModal from './MemberProfileModal'

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
