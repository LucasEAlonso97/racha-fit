import {
  useGroupPerks,
} from '../hooks/useGroupPerks'

import type {
  User,
} from '../types'

type Props = {
  users: User[]
  currentUserId: string
}

/*
 * ========================================
 * MEGÁFONO (premio de torneo)
 * ========================================
 *
 * Mensaje fijo arriba del inicio para
 * todo el grupo durante 24 h.
 */

function MegaphoneBanner({
  users,
  currentUserId,
}: Props) {
  const { banner } = useGroupPerks()

  if (
    !banner ||
    new Date(banner.expiresAt) <= new Date()
  ) {
    return null
  }

  const author = users.find(
    (user) => user.id === banner.userId,
  )

  const authorName =
    banner.userId === currentUserId
      ? 'Vos'
      : (author?.name ?? 'El campeón')

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 p-[2px] shadow-sm">
        <div className="flex items-center gap-3 rounded-[14px] bg-white/95 px-4 py-3">
          <span className="text-2xl">
            📣
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-wider text-fuchsia-500">
              MEGÁFONO DE {authorName.toUpperCase()}
            </p>

            <p className="mt-0.5 font-black text-zinc-800">
              {banner.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MegaphoneBanner
