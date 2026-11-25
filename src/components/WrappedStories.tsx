import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  LoaderCircle,
  Share2,
  X,
} from 'lucide-react'

import UserAvatar from './UserAvatar'

import {
  getActivityEmoji,
} from '../data/activities'

import {
  useTrophyCabinet,
} from '../hooks/useTrophyCabinet'

import {
  showToast,
} from '../lib/feedback'

import {
  drawSummaryCard,
  shareImage,
} from '../lib/shareCards'

import {
  monthNames,
  weekDayNames,
} from '../utils/date'

import {
  computeWrapped,
  formatHours,
  type WrappedStats,
} from '../utils/wrapped'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  year: number
  groupId: string
  groupName: string
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  onClose: () => void
}

type Slide = {
  id: string
  background: string
  content: ReactNode
}

/*
 * Plural de los días de la semana:
 * "los martes", "los sábados".
 */
function weekdayPlural(
  weekday: number,
) {
  const name = weekDayNames[weekday]

  return name.endsWith('s')
    ? name
    : `${name}s`
}

function Big({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="text-[96px] font-black leading-none tracking-tight drop-shadow-sm">
      {children}
    </p>
  )
}

function Kicker({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">
      {children}
    </p>
  )
}

function Line({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="mt-4 text-2xl font-black leading-tight">
      {children}
    </p>
  )
}

function Note({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="mt-6 text-base font-semibold leading-relaxed text-white/85">
      {children}
    </p>
  )
}

function buildSlides(
  stats: WrappedStats,
  groupName: string,
  trophies: number,
  footer: ReactNode,
): Slide[] {
  const slides: Slide[] = []

  slides.push({
    id: 'intro',
    background:
      'from-violet-600 via-fuchsia-500 to-orange-400',
    content: (
      <>
        <p className="text-7xl">🔥</p>
        <p className="mt-6 text-5xl font-black leading-[1.05]">
          Tu {stats.year}
          <br />
          en Racha
        </p>
        <Note>
          Un repaso de todo lo que
          entrenaste en{' '}
          <b>{groupName}</b>. Tocá para
          avanzar.
        </Note>
      </>
    ),
  })

  if (stats.daysTrained === 0) {
    slides.push({
      id: 'empty',
      background:
        'from-zinc-700 via-violet-700 to-fuchsia-600',
      content: (
        <>
          <p className="text-6xl">🌱</p>
          <Line>
            Todavía no cargaste
            actividades en{' '}
            {stats.year}.
          </Line>
          <Note>
            Cada día cuenta. El año que
            viene este resumen va a
            estar lleno.
          </Note>
        </>
      ),
    })

    return slides
  }

  slides.push({
    id: 'days',
    background:
      'from-fuchsia-600 via-pink-500 to-orange-400',
    content: (
      <>
        <Kicker>Este año entrenaste</Kicker>
        <div className="mt-4">
          <Big>{stats.daysTrained}</Big>
        </div>
        <Line>
          {stats.daysTrained === 1
            ? 'día'
            : 'días'}
        </Line>
        <Note>
          Fueron {stats.activitiesCount}{' '}
          {stats.activitiesCount === 1
            ? 'actividad'
            : 'actividades'}{' '}
          y{' '}
          <b>
            {formatHours(
              stats.totalMinutes,
            )}{' '}
            horas
          </b>{' '}
          en movimiento.
        </Note>
      </>
    ),
  })

  if (stats.topSport) {
    slides.push({
      id: 'sport',
      background:
        'from-orange-500 via-amber-400 to-pink-500',
      content: (
        <>
          <Kicker>Tu deporte del año</Kicker>
          <p className="mt-6 text-[110px] leading-none">
            {getActivityEmoji(
              stats.topSport.type,
            )}
          </p>
          <p className="mt-4 text-5xl font-black">
            {stats.topSport.type}
          </p>
          <Note>
            {stats.topSport.count}{' '}
            {stats.topSport.count === 1
              ? 'vez'
              : 'veces'}
            .
            {stats.sportsTried > 1
              ? ` Y en total probaste ${stats.sportsTried} deportes distintos.`
              : ' Fiel a lo tuyo.'}
          </Note>
        </>
      ),
    })
  }

  slides.push({
    id: 'streak',
    background:
      'from-rose-500 via-orange-500 to-amber-400',
    content: (
      <>
        <Kicker>Tu racha más larga</Kicker>
        <div className="mt-4">
          <Big>{stats.bestStreak}</Big>
        </div>
        <Line>
          {stats.bestStreak === 1
            ? 'día seguido'
            : 'días seguidos'}{' '}
          🔥
        </Line>
        {stats.bestMonth && (
          <Note>
            Tu mejor mes fue{' '}
            <b>
              {
                monthNames[
                  stats.bestMonth.month
                ]
              }
            </b>
            , con{' '}
            {stats.bestMonth.days}{' '}
            {stats.bestMonth.days === 1
              ? 'día'
              : 'días'}{' '}
            entrenados.
          </Note>
        )}
      </>
    ),
  })

  if (stats.favoriteWeekday) {
    slides.push({
      id: 'weekday',
      background:
        'from-indigo-600 via-violet-500 to-fuchsia-500',
      content: (
        <>
          <Kicker>Tu día favorito</Kicker>
          <p className="mt-6 text-6xl font-black leading-tight">
            Los{' '}
            {weekdayPlural(
              stats.favoriteWeekday
                .weekday,
            )}
          </p>
          <Note>
            Entrenaste{' '}
            {stats.favoriteWeekday.days}{' '}
            {stats.favoriteWeekday.days === 1
              ? weekDayNames[
                  stats.favoriteWeekday
                    .weekday
                ]
              : weekdayPlural(
                  stats.favoriteWeekday
                    .weekday,
                )}
            . Ese día es tuyo.
          </Note>
        </>
      ),
    })
  }

  if (stats.buddy) {
    slides.push({
      id: 'buddy',
      background:
        'from-emerald-500 via-teal-500 to-violet-500',
      content: (
        <>
          <Kicker>Tu compañero de racha</Kicker>
          <div className="mx-auto mt-12 w-fit scale-[1.8] rounded-full ring-2 ring-white/70">
            <UserAvatar
              user={stats.buddy.user}
              size="lg"
            />
          </div>
          <p className="mt-10 text-4xl font-black">
            {stats.buddy.user.name}
          </p>
          <Note>
            Entrenaron el mismo día{' '}
            <b>
              {stats.buddy.sharedDays}{' '}
              {stats.buddy.sharedDays === 1
                ? 'vez'
                : 'veces'}
            </b>
            . Se tiran para arriba.
          </Note>
        </>
      ),
    })
  }

  if (stats.membersCount > 1) {
    slides.push({
      id: 'group',
      background:
        'from-violet-600 via-purple-500 to-pink-500',
      content: (
        <>
          <Kicker>En {groupName}</Kicker>
          <div className="mt-4">
            <Big>#{stats.rank}</Big>
          </div>
          <Line>
            de {stats.membersCount} en días
            entrenados
            {stats.rank === 1
              ? ' 👑'
              : ''}
          </Line>
          <Note>
            Entre todos sumaron{' '}
            <b>{stats.groupDays} días</b> de
            entrenamiento.
            {stats.reactionsReceived > 0
              ? ` Y tus actividades recibieron ${stats.reactionsReceived} reacciones.`
              : ''}
          </Note>
        </>
      ),
    })
  }

  if (
    trophies > 0 ||
    stats.wildcardsUsed > 0 ||
    stats.photosCount > 0
  ) {
    slides.push({
      id: 'extras',
      background:
        'from-amber-500 via-orange-500 to-fuchsia-600',
      content: (
        <>
          <Kicker>Y además</Kicker>
          <div className="mt-8 space-y-4 text-left">
            {trophies > 0 && (
              <ExtraRow
                emoji="🏆"
                text={`Ganaste ${trophies} ${trophies === 1 ? 'torneo' : 'torneos'}`}
              />
            )}
            {stats.photosCount > 0 && (
              <ExtraRow
                emoji="📸"
                text={`Subiste ${stats.photosCount} ${stats.photosCount === 1 ? 'foto' : 'fotos'}`}
              />
            )}
            {stats.wildcardsUsed > 0 && (
              <ExtraRow
                emoji="🃏"
                text={`Salvaste ${stats.wildcardsUsed} ${stats.wildcardsUsed === 1 ? 'día' : 'días'} con comodín`}
              />
            )}
          </div>
        </>
      ),
    })
  }

  slides.push({
    id: 'final',
    background:
      'from-violet-600 via-fuchsia-500 to-orange-400',
    content: (
      <>
        <p className="text-7xl">
          {stats.title.emoji}
        </p>
        <Kicker>
          <span className="mt-4 block">
            Tu {stats.year} en una frase
          </span>
        </Kicker>
        <p className="mt-3 text-4xl font-black leading-tight">
          {stats.title.label}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <SummaryBox
            value={String(stats.daysTrained)}
            label="días"
          />
          <SummaryBox
            value={formatHours(
              stats.totalMinutes,
            )}
            label="horas"
          />
          <SummaryBox
            value={String(stats.bestStreak)}
            label="racha máx."
          />
          <SummaryBox
            value={
              stats.topSport
                ? getActivityEmoji(
                    stats.topSport.type,
                  )
                : '—'
            }
            label={
              stats.topSport?.type ??
              'deporte'
            }
          />
        </div>

        {footer}
      </>
    ),
  })

  return slides
}

function ExtraRow({
  emoji,
  text,
}: {
  emoji: string
  text: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white/15 px-5 py-4">
      <span className="text-4xl">
        {emoji}
      </span>
      <span className="text-xl font-black">
        {text}
      </span>
    </div>
  )
}

function SummaryBox({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="rounded-3xl bg-white/15 px-3 py-4">
      <p className="truncate text-3xl font-black">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-bold uppercase tracking-wider text-white/80">
        {label}
      </p>
    </div>
  )
}

function WrappedStories({
  year,
  groupId,
  groupName,
  activities,
  users,
  currentUserId,
  onClose,
}: Props) {
  const [index, setIndex] =
    useState(0)

  const [sharing, setSharing] =
    useState(false)

  const shelves =
    useTrophyCabinet(groupId)

  const stats = useMemo(
    () =>
      computeWrapped(
        activities,
        users,
        currentUserId,
        year,
      ),
    [
      activities,
      users,
      currentUserId,
      year,
    ],
  )

  const trophies =
    shelves
      ?.find(
        (shelf) =>
          shelf.user_id ===
          currentUserId,
      )
      ?.trophies.filter(
        (trophy) =>
          new Date(
            trophy.finished_at,
          ).getFullYear() === year,
      ).length ?? 0

  const share = async () => {
    setSharing(true)

    try {
      const blob =
        await drawSummaryCard({
          title: `Mi ${year} en Racha`,
          subtitle: `${stats.title.emoji} ${stats.title.label}`,
          stats: [
            {
              value: String(
                stats.daysTrained,
              ),
              label: 'días entrenados',
            },
            {
              value: formatHours(
                stats.totalMinutes,
              ),
              label: 'horas',
            },
            {
              value: String(
                stats.bestStreak,
              ),
              label: 'racha más larga',
            },
            {
              value:
                stats.topSport?.type ??
                '—',
              label: 'deporte top',
            },
          ],
        })

      const result =
        await shareImage(
          blob,
          `racha-wrapped-${year}.png`,
          `Mi ${year} en Racha: ${stats.daysTrained} días entrenados 🔥`,
        )

      if (result === 'downloaded') {
        showToast(
          'Imagen descargada. ¡Subila a tus historias!',
          'success',
        )
      }
    } catch (error) {
      console.error(
        'Error compartiendo Wrapped:',
        error,
      )

      showToast(
        'No pudimos armar la imagen.',
      )
    } finally {
      setSharing(false)
    }
  }

  const footer = (
    <div className="relative z-10 mt-8 space-y-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          void share()
        }}
        disabled={sharing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-black text-fuchsia-600 shadow-lg transition active:scale-[0.98] disabled:opacity-70"
      >
        {sharing ? (
          <LoaderCircle
            size={20}
            className="animate-spin"
          />
        ) : (
          <Share2 size={20} />
        )}
        Compartir en historias
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        className="w-full py-2 text-sm font-bold text-white/80"
      >
        Cerrar
      </button>
    </div>
  )

  const slides = buildSlides(
    stats,
    groupName,
    trophies,
    footer,
  )

  const safeIndex = Math.min(
    index,
    slides.length - 1,
  )

  const slide = slides[safeIndex]

  const isLast =
    safeIndex === slides.length - 1

  const go = (delta: number) => {
    setIndex((current) =>
      Math.max(
        0,
        Math.min(
          slides.length - 1,
          current + delta,
        ),
      ),
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tu ${year} en Racha`}
      className={`fixed inset-0 z-[90] flex flex-col bg-gradient-to-br text-white transition-colors duration-500 ${slide.background}`}
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/10" />

      <div className="relative z-20 mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex gap-1">
          {slides.map((item, itemIndex) => (
            <div
              key={item.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className={`h-full rounded-full bg-white transition-all duration-300 ${
                  itemIndex <= safeIndex
                    ? 'w-full'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-black text-white/90">
            Racha Wrapped {year}
          </p>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center"
        onClick={(event) => {
          const bounds =
            event.currentTarget.getBoundingClientRect()

          const x =
            event.clientX - bounds.left

          if (x < bounds.width / 3) {
            go(-1)
          } else if (!isLast) {
            go(1)
          }
        }}
      >
        <div
          key={slide.id}
          className="wrapped-pop mx-auto w-full max-w-md px-8 pb-[max(env(safe-area-inset-bottom),24px)] text-center"
        >
          {slide.content}
        </div>
      </div>
    </div>
  )
}

export default WrappedStories
