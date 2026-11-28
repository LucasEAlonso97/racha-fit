import {
  ChevronLeft,
  ChevronRight,
  Gift,
  LoaderCircle,
  Trophy,
} from 'lucide-react'

import {
  useMemo,
  useState,
} from 'react'

import type {
  ActivitiesByDate,
} from '../types'

import {
  getAchievements,
  getClaimableAchievements,
  giftLabel,
  tierHasGift,
} from '../utils/achievements'

import type {
  ClaimResult,
} from '../hooks/useAchievementClaims'

import {
  showToast,
} from '../lib/feedback'

import {
  celebrate,
} from '../lib/celebrate'

type Props = {
  activities: ActivitiesByDate
  currentUserId: string

  /*
   * Regalos (si la migración está corrida).
   */
  giftsEnabled: boolean
  claimed: Set<string>
  onClaim: (
    achievementId: string,
  ) => Promise<ClaimResult>
}

const achievementsPerPage = 6

function Achievements({
  activities,
  currentUserId,
  giftsEnabled,
  claimed,
  onClaim,
}: Props) {
  const [
    currentPage,
    setCurrentPage,
  ] = useState(0)

  const [claiming, setClaiming] =
    useState<string | null>(null)

  const [claimingAll, setClaimingAll] =
    useState(false)

  /*
   * Los que tienen regalo para reclamar
   * van primero, así se ven en la
   * primera página.
   */
  const achievements = useMemo(() => {
    const list = getAchievements(
      activities,
      currentUserId,
    )

    if (!giftsEnabled) {
      return list
    }

    const claimable = new Set(
      getClaimableAchievements(
        list,
        claimed,
      ).map((item) => item.id),
    )

    return [
      ...list.filter((item) =>
        claimable.has(item.id),
      ),
      ...list.filter(
        (item) => !claimable.has(item.id),
      ),
    ]
  }, [
    activities,
    currentUserId,
    giftsEnabled,
    claimed,
  ])

  const claimable = giftsEnabled
    ? getClaimableAchievements(
        achievements,
        claimed,
      )
    : []

  const announce = (
    result: Extract<
      ClaimResult,
      {
        ok: true
      }
    >,
  ) => {
    celebrate(result.crown ? '👑' : '🃏')

    showToast(
      result.crown
        ? '¡+1 comodín y corona 👑 por 7 días!'
        : '¡+1 comodín! 🃏',
      'success',
    )
  }

  const claimOne = async (
    achievementId: string,
  ) => {
    if (claiming || claimingAll) {
      return
    }

    setClaiming(achievementId)

    try {
      const result =
        await onClaim(achievementId)

      if (result.ok) {
        announce(result)
      } else {
        showToast(result.message)
      }
    } finally {
      setClaiming(null)
    }
  }

  const claimAll = async () => {
    if (claiming || claimingAll) {
      return
    }

    setClaimingAll(true)

    let wildcards = 0
    let crowns = 0
    let stopMessage: string | null = null

    try {
      for (const item of claimable) {
        const result = await onClaim(
          item.id,
        )

        if (!result.ok) {
          stopMessage = result.message
          break
        }

        wildcards += 1

        if (result.crown) {
          crowns += 1
        }
      }
    } finally {
      setClaimingAll(false)
    }

    if (wildcards > 0) {
      celebrate(crowns > 0 ? '👑' : '🃏')

      showToast(
        `¡+${wildcards} ${wildcards === 1 ? 'comodín' : 'comodines'}${
          crowns > 0
            ? ' y corona 👑'
            : ''
        }!`,
        'success',
      )
    }

    if (stopMessage) {
      showToast(stopMessage, 'info', {
        durationMs: 6000,
      })
    }
  }

  /*
   * ========================================
   * PAGINACIÓN
   * ========================================
   */

  const totalPages =
    Math.ceil(
      achievements.length /
        achievementsPerPage,
    )

  const visibleAchievements =
    achievements.slice(
      currentPage *
        achievementsPerPage,
      currentPage *
        achievementsPerPage +
        achievementsPerPage,
    )

  const unlockedCount =
    achievements.filter(
      (achievement) =>
        achievement.unlocked,
    ).length

  const goPrevious =
    () => {
      setCurrentPage(
        (page) =>
          Math.max(
            page - 1,
            0,
          ),
      )
    }

  const goNext =
    () => {
      setCurrentPage(
        (page) =>
          Math.min(
            page + 1,
            totalPages - 1,
          ),
      )
    }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <section className="mb-5 rounded-[28px] bg-white p-5 shadow-sm">
      {/* HEADER */}

      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-violet-500">
              TUS LOGROS
            </p>

            <h2 className="mt-1 text-xl font-black text-zinc-800">
              Lo que ya conseguiste
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {unlockedCount} de{' '}
              {achievements.length}{' '}
              desbloqueados
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-50 text-yellow-500">
            <Trophy
              size={22}
            />
          </div>
        </div>

        {/* NAVEGACIÓN */}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-500">
            Página{' '}
            {currentPage + 1} de{' '}
            {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                goPrevious
              }
              disabled={
                currentPage === 0
              }
              aria-label="Logros anteriores"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 transition active:scale-95 disabled:text-zinc-300 disabled:opacity-40"
            >
              <ChevronLeft
                size={20}
              />
            </button>

            <button
              type="button"
              onClick={
                goNext
              }
              disabled={
                currentPage ===
                totalPages - 1
              }
              aria-label="Siguientes logros"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition active:scale-95 disabled:bg-zinc-100 disabled:text-zinc-300 disabled:opacity-40"
            >
              <ChevronRight
                size={20}
              />
            </button>
          </div>
        </div>
      </div>

      {/* REGALOS PARA RECLAMAR */}

      {claimable.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-[22px] bg-gradient-to-r from-amber-400 via-orange-400 to-fuchsia-500 p-4 text-white shadow-md shadow-orange-100">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/25">
            <Gift size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight">
              {claimable.length === 1
                ? 'Tenés 1 regalo para reclamar'
                : `Tenés ${claimable.length} regalos para reclamar`}
            </p>

            <p className="mt-0.5 text-xs font-semibold text-white/85">
              Comodines y coronas por tus logros
            </p>
          </div>

          {claimable.length > 1 && (
            <button
              type="button"
              onClick={() =>
                void claimAll()
              }
              disabled={
                claimingAll ||
                Boolean(claiming)
              }
              className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-orange-600 transition active:scale-95 disabled:opacity-70"
            >
              {claimingAll && (
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                />
              )}
              Todos
            </button>
          )}
        </div>
      )}

      {/* LOGROS */}

      <div className="grid grid-cols-2 gap-3">
        {visibleAchievements.map(
          (achievement) => {
            const unlocked =
              achievement.unlocked

            const hasGift =
              giftsEnabled &&
              tierHasGift(
                achievement.tier,
              )

            const isClaimed =
              claimed.has(
                achievement.id,
              )

            const canClaim =
              hasGift &&
              unlocked &&
              !isClaimed

            const progress =
              Math.min(
                (
                  achievement.current /
                  achievement.goal
                ) * 100,
                100,
              )

            const Icon =
              achievement.icon

            return (
              <div
                key={
                  achievement.id
                }
                className={`flex min-h-[185px] flex-col rounded-[22px] p-4 ${
                  unlocked
                    ? 'bg-violet-50'
                    : 'bg-zinc-50'
                }`}
              >
                {/* ICONO */}

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                    unlocked
                      ? 'bg-violet-500 text-white'
                      : 'bg-zinc-200 text-zinc-500'
                  }`}
                >
                  <Icon
                    size={20}
                  />
                </div>

                {/* TEXTO */}

                <h3
                  className={`mt-3 text-sm font-bold ${
                    unlocked
                      ? 'text-zinc-800'
                      : 'text-zinc-500'
                  }`}
                >
                  {
                    achievement.title
                  }
                </h3>

                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">
                  {
                    achievement.description
                  }
                </p>

                {/* ESTADO */}

                {canClaim ? (
                  <button
                    type="button"
                    onClick={() =>
                      void claimOne(
                        achievement.id,
                      )
                    }
                    disabled={
                      Boolean(claiming) ||
                      claimingAll
                    }
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-2 text-xs font-bold text-white shadow-sm shadow-orange-200 transition active:scale-95 disabled:opacity-70"
                  >
                    {claiming ===
                    achievement.id ? (
                      <LoaderCircle
                        size={13}
                        className="animate-spin"
                      />
                    ) : (
                      <Gift size={13} />
                    )}
                    Reclamar
                  </button>
                ) : unlocked ? (
                  <p className="mt-3 text-xs font-bold text-violet-600">
                    {hasGift && isClaimed
                      ? 'Desbloqueado · 🎁 ✓'
                      : 'Desbloqueado'}
                  </p>
                ) : (
                  <>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-all duration-500"
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1.5 text-xs font-bold text-zinc-500">
                      {Math.min(
                        achievement.current,
                        achievement.goal,
                      )}{' '}
                      /{' '}
                      {
                        achievement.goal
                      }
                    </p>
                  </>
                )}

                {hasGift &&
                  !isClaimed && (
                    <p
                      className={`mt-1.5 text-xs font-bold ${
                        canClaim
                          ? 'text-orange-500'
                          : 'text-amber-500/80'
                      }`}
                    >
                      🎁{' '}
                      {giftLabel(
                        achievement.tier,
                      )}
                    </p>
                  )}
              </div>
            )
          },
        )}
      </div>

      {/* INDICADOR DE PÁGINAS */}

      <div className="mt-5 flex justify-center gap-2">
        {Array.from({
          length:
            totalPages,
        }).map(
          (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir a página ${
                index + 1
              }`}
              onClick={() =>
                setCurrentPage(
                  index,
                )
              }
              className={`h-2 rounded-full transition-all ${
                currentPage ===
                index
                  ? 'w-6 bg-violet-500'
                  : 'w-2 bg-violet-200'
              }`}
            />
          ),
        )}
      </div>
    </section>
  )
}

export default Achievements