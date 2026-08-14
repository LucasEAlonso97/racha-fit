import {
  useEffect,
  useState,
} from 'react'

import type {
  User,
} from '../types'

type Props = {
  user: User
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-7 w-7 text-[9px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-base',
}

function UserAvatar({
  user,
  size = 'md',
}: Props) {
  const [
    imageFailed,
    setImageFailed,
  ] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [user.avatar])

  if (
    user.avatar &&
    !imageFailed
  ) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        title={user.name}
        onError={() =>
          setImageFailed(true)
        }
        className={`${sizes[size]} rounded-full border-2 border-white object-cover shadow-sm`}
      />
    )
  }

  return (
    <div
      title={user.name}
      className={`${sizes[size]} ${user.avatarColor} flex items-center justify-center rounded-full border-2 border-white font-black text-white shadow-sm`}
    >
      {user.fallback}
    </div>
  )
}

export default UserAvatar