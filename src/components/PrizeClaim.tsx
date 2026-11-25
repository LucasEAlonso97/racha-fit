import {
  useSwipeToClose,
} from '../hooks/useSwipeToClose'
import {
  useState,
} from 'react'

import {
  Check,
  Gift,
  LoaderCircle,
  X,
} from 'lucide-react'

import UserAvatar from './UserAvatar'

import {
  showToast,
} from '../lib/feedback'

import {
  claimTournamentPrize,
  isPrizeType,
  MEGAPHONE_OPTIONS,
  NICKNAME_OPTIONS,
  PRIZE_COPY,
} from '../lib/tournamentPrizes'

import type {
  User,
} from '../types'

type Prize = {
  title: string
  emoji: string
  description: string
  prize_type?: string | null
}

type Props = {
  tournamentId: string
  prize: Prize
  winnerIds: string[]
  claims: string[]
  users: User[]
  currentUserId: string

  /*
   * 'card': tarjeta grande (resultado).
   * 'compact': dentro del historial.
   */
  variant?: 'card' | 'compact'

  /* Empate de equipos: premio vacante. */
  vacant?: boolean

  onClaimed: () => void
}

/*
 * ========================================
 * PREMIO DEL TORNEO (Y RECLAMARLO)
 * ========================================
 */

function PrizeClaim({
  tournamentId,
  prize,
  winnerIds,
  claims,
  users,
  currentUserId,
  variant = 'card',
  vacant = false,
  onClaimed,
}: Props) {
  const [claiming, setClaiming] =
    useState(false)

  const [choosing, setChoosing] =
    useState(false)

  const prizeType = isPrizeType(
    prize.prize_type,
  )
    ? prize.prize_type
    : null

  const iWon =
    winnerIds.includes(currentUserId)

  const iClaimed =
    claims.includes(currentUserId)

  const canClaim =
    Boolean(prizeType) &&
    iWon &&
    !iClaimed &&
    !vacant

  const claim = async (
    options: {
      targetUserId?: string
      choice?: string
    } = {},
  ) => {
    if (!prizeType || claiming) {
      return
    }

    setClaiming(true)

    const result =
      await claimTournamentPrize(
        tournamentId,
        options,
      )

    setClaiming(false)

    if (!result.ok) {
      showToast(result.message)

      return
    }

    setChoosing(false)

    showToast(
      result.fallback
        ? 'Otro ganador ya eligió el próximo torneo: ¡te llevás un comodín! 🃏'
        : PRIZE_COPY[
            result.prizeType ?? prizeType
          ].claimedText,
      'success',
    )

    onClaimed()
  }

  const onClaimClick = () => {
    if (
      prizeType === 'nickname' ||
      prizeType === 'megaphone'
    ) {
      setChoosing(true)

      return
    }

    void claim()
  }

  const winnerNames = winnerIds
    .map(
      (id) =>
        users.find((user) => user.id === id),
    )
    .filter(
      (user): user is User => Boolean(user),
    )

  /*
   * Estado / acción debajo del premio.
   */
  const action = vacant ? (
    <p className="text-sm font-semibold text-zinc-500">
      Empate entre equipos: esta vez el
      premio queda vacante 🤝
    </p>
  ) : canClaim ? (
    <button
      type="button"
      disabled={claiming}
      onClick={onClaimClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3.5 text-sm font-black text-white shadow-lg shadow-fuchsia-200 transition active:scale-[0.98] disabled:opacity-60"
    >
      {claiming ? (
        <LoaderCircle
          size={18}
          className="animate-spin"
        />
      ) : (
        <Gift size={18} />
      )}
      {PRIZE_COPY[prizeType!].claimLabel}
    </button>
  ) : iWon && iClaimed ? (
    <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-50 py-3 text-sm font-black text-emerald-600">
      <Check
        size={16}
        strokeWidth={3}
      />
      Premio reclamado
    </p>
  ) : prizeType && winnerNames.length > 0 ? (
    <div className="flex flex-wrap justify-center gap-2">
      {winnerNames.map((user) => (
        <span
          key={user.id}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
            claims.includes(user.id)
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {claims.includes(user.id)
            ? '✓'
            : '⏳'}{' '}
          {user.name}
        </span>
      ))}
    </div>
  ) : null

  return (
    <>
      {variant === 'card' ? (
        <section className="mt-5 rounded-[28px] bg-gradient-to-br from-violet-200 via-fuchsia-200 to-orange-200 p-[2px] shadow-sm">
          <div className="rounded-[26px] bg-white p-5 text-center">
            <p className="text-[10px] font-black tracking-[0.16em] text-fuchsia-500">
              PREMIO
            </p>

            <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-50 to-orange-50 text-4xl shadow-inner">
              {prize.emoji}
            </div>

            <h3 className="mt-3 text-xl font-black text-zinc-800">
              {prize.title}
            </h3>

            <p className="mx-auto mt-1 max-w-[280px] text-sm font-semibold leading-relaxed text-zinc-500">
              {prize.description}
            </p>

            {action && (
              <div className="mt-4">
                {action}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="rounded-xl bg-amber-50 px-3 py-2.5">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              {prize.emoji}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">
                Premio
              </p>

              <p className="mt-0.5 text-xs font-black text-zinc-700">
                {prize.title}
              </p>
            </div>
          </div>

          {action && (canClaim || (iWon && iClaimed)) && (
            <div className="mt-2.5">
              {action}
            </div>
          )}
        </div>
      )}

      {choosing && prizeType && (
        <ChoiceSheet
          prizeType={prizeType}
          users={users.filter(
            (user) =>
              user.id !== currentUserId,
          )}
          claiming={claiming}
          onClose={() =>
            setChoosing(false)
          }
          onConfirm={(options) =>
            void claim(options)
          }
        />
      )}
    </>
  )
}

/*
 * ========================================
 * ELEGIR APODO / MENSAJE
 * ========================================
 */

function ChoiceSheet({
  prizeType,
  users,
  claiming,
  onClose,
  onConfirm,
}: {
  prizeType: 'nickname' | 'megaphone' | string
  users: User[]
  claiming: boolean
  onClose: () => void
  onConfirm: (options: {
    targetUserId?: string
    choice?: string
  }) => void
}) {
  const sheetRef =
    useSwipeToClose(onClose)

  const isNickname =
    prizeType === 'nickname'

  const [targetUserId, setTargetUserId] =
    useState<string | null>(null)

  const [choice, setChoice] = useState<
    string | null
  >(null)

  const options = isNickname
    ? NICKNAME_OPTIONS
    : MEGAPHONE_OPTIONS

  const ready =
    Boolean(choice) &&
    (!isNickname || Boolean(targetUserId))

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-fuchsia-500">
              {isNickname
                ? '🏷️ Apodo por 7 días'
                : '📣 Megáfono por 24 h'}
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {isNickname
                ? '¿A quién y cuál?'
                : '¿Qué querés decir?'}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {isNickname && (
          <>
            <p className="mb-2 mt-6 text-xs font-black tracking-wide text-zinc-400">
              A QUIÉN
            </p>

            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() =>
                    setTargetUserId(user.id)
                  }
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-black transition ${
                    targetUserId === user.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <UserAvatar
                    user={user}
                    size="sm"
                  />
                  {user.name}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mb-2 mt-6 text-xs font-black tracking-wide text-zinc-400">
          {isNickname ? 'APODO' : 'MENSAJE'}
        </p>

        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setChoice(option)}
              className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${
                choice === option
                  ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-200'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!ready || claiming}
          onClick={() =>
            onConfirm({
              targetUserId:
                targetUserId ?? undefined,
              choice: choice ?? undefined,
            })
          }
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-4 font-black text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          {claiming && (
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
          )}
          Confirmar
        </button>
      </div>
    </div>
  )
}

export default PrizeClaim
