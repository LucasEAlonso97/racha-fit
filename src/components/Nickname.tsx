import {
  useGroupPerks,
} from '../hooks/useGroupPerks'

type Props = {
  userId: string
  className?: string
}

/*
 * Apodo activo (premio de torneo),
 * si la persona tiene uno.
 */
function Nickname({
  userId,
  className = '',
}: Props) {
  const { nicknames } = useGroupPerks()

  const nickname = nicknames.get(userId)

  if (!nickname) {
    return null
  }

  return (
    <span
      title="Apodo puesto por quien ganó un torneo"
      className={`inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 ${className}`}
    >
      🏷️ {nickname}
    </span>
  )
}

export default Nickname
