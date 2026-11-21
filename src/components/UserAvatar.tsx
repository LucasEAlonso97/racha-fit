import {
  useEffect,
  useState,
} from 'react'

import {
  useGroupPerks,
} from '../hooks/useGroupPerks'

import type {
  User,
} from '../types'

type Props = {
  user: User
  size?: 'sm' | 'md' | 'lg'
}

/*
 * Corona (premio de torneo) arriba
 * del avatar, según el tamaño.
 */
const crownSizes = {
  sm: '-top-2.5 text-[11px]',
  md: '-top-3 text-sm',
  lg: '-top-4 text-xl',
}

const sizes = {
  sm: 'h-7 w-7 text-[9px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-14 w-14 text-base',
}

function AvatarImage({
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

function UserAvatar(props: Props) {
  const { crowned } = useGroupPerks()

  if (!crowned.has(props.user.id)) {
    return <AvatarImage {...props} />
  }

  const size = props.size ?? 'md'

  return (
    <span className="relative inline-flex shrink-0">
      <AvatarImage {...props} />

      <span
        aria-label="Corona de campeón"
        title="Ganó el último torneo"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 drop-shadow ${crownSizes[size]}`}
      >
        👑
      </span>
    </span>
  )
}

export default UserAvatar