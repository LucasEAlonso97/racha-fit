import {
  useMemo,
} from 'react'

import {
  X,
} from 'lucide-react'

import ActivityPhoto from './ActivityPhoto'
import UserAvatar from './UserAvatar'

import {
  activityOptions,
} from '../data/activities'

import {
  collectPhotos,
} from '../lib/activityState'

import {
  getBestStreak,
  getCurrentStreak,
  getWeekActivityCount,
} from '../utils/activityStats'

import {
  monthNames,
  parseDateKey,
} from '../utils/date'

import {
  formatMinutes,
  getPeriodSummary,
} from '../utils/periodSummary'

import type {
  ActivitiesByDate,
  ActivityType,
  User,
} from '../types'

type Props = {
  user: User
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
  onClose: () => void
}

const RECENT_LIMIT = 5
const PHOTO_LIMIT = 9

function getActivityEmoji(
  type: ActivityType | null,
) {
  return (
    activityOptions.find(
      (option) => option.name === type,
    )?.emoji ?? '✨'
  )
}

function formatShortDate(
  dateKey: string,
) {
  const date = parseDateKey(dateKey)

  return `${date.getDate()} de ${monthNames[date.getMonth()]}`
}

/*
 * ========================================
 * PERFIL DE UN INTEGRANTE
 * ========================================
 */

function MemberProfileModal({
  user,
  activities,
  users,
  currentUserId,
  today,
  onClose,
}: Props) {
  const isMe = user.id === currentUserId

  const stats = useMemo(() => {
    const monthSummary =
      getPeriodSummary(
        activities,
        users,
        {
          kind: 'month',
          year: today.getFullYear(),
          month: today.getMonth(),
        },
      ).members.find(
        (member) =>
          member.user.id === user.id,
      )

    /*
     * Favorita de todo el historial.
     */
    const typeCounts = new Map<
      ActivityType,
      number
    >()

    const recent: {
      dateKey: string
      type: ActivityType
      duration: number
    }[] = []

    Object.keys(activities)
      .sort()
      .reverse()
      .forEach((dateKey) => {
        const userActivities =
          activities[dateKey][user.id] ??
          []

        ;[...userActivities]
          .reverse()
          .forEach((activity) => {
            typeCounts.set(
              activity.type,
              (typeCounts.get(
                activity.type,
              ) ?? 0) + 1,
            )

            if (
              recent.length < RECENT_LIMIT
            ) {
              recent.push({
                dateKey,
                type: activity.type,
                duration:
                  activity.duration,
              })
            }
          })
      })

    let favorite: ActivityType | null =
      null
    let favoriteCount = 0

    typeCounts.forEach((count, type) => {
      if (count > favoriteCount) {
        favorite = type
        favoriteCount = count
      }
    })

    return {
      currentStreak: getCurrentStreak(
        activities,
        user.id,
        today,
      ),
      bestStreak: getBestStreak(
        activities,
        user.id,
      ),
      weekDays: getWeekActivityCount(
        activities,
        user.id,
        today,
      ),
      monthDays:
        monthSummary?.activeDays ?? 0,
      monthMinutes:
        monthSummary?.totalMinutes ?? 0,
      favorite,
      recent,
      photos: collectPhotos(
        activities,
        user.id,
      ).slice(0, PHOTO_LIMIT),
    }
  }, [activities, users, user.id, today])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-5"
      >
        <div className="flex justify-end">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* CABECERA */}

        <div className="-mt-4 flex flex-col items-center text-center">
          <UserAvatar
            user={user}
            size="lg"
          />

          <h2 className="mt-3 text-2xl font-black text-zinc-800">
            {isMe ? 'Vos' : user.name}
          </h2>

          {stats.favorite && (
            <p className="mt-1 text-sm font-semibold text-zinc-500">
              {getActivityEmoji(
                stats.favorite,
              )}{' '}
              Le encanta:{' '}
              {stats.favorite}
            </p>
          )}
        </div>

        {/* NÚMEROS */}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat
            value={`🔥 ${stats.currentStreak}`}
            label="racha actual"
          />

          <Stat
            value={`🏆 ${stats.bestStreak}`}
            label="récord"
          />

          <Stat
            value={`${stats.weekDays}/${user.weeklyGoal}`}
            label="días esta semana"
          />

          <Stat
            value={formatMinutes(
              stats.monthMinutes,
            )}
            label={`este mes · ${stats.monthDays} ${stats.monthDays === 1 ? 'día' : 'días'}`}
          />
        </div>

        {/* FOTOS */}

        {stats.photos.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-black tracking-wider text-zinc-400">
              FOTOS
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {stats.photos.map(
                (photo) => (
                  <ActivityPhoto
                    key={photo.url}
                    url={photo.url}
                    variant="square"
                    alt={`${photo.activity.type} de ${user.name}`}
                    caption={`${getActivityEmoji(photo.activity.type)} ${photo.activity.type} · ${formatShortDate(photo.dateKey)}`}
                  />
                ),
              )}
            </div>
          </section>
        )}

        {/* ÚLTIMAS ACTIVIDADES */}

        <section className="mt-6">
          <h3 className="mb-3 text-xs font-black tracking-wider text-zinc-400">
            ÚLTIMAS ACTIVIDADES
          </h3>

          {stats.recent.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Todavía no registró nada.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.recent.map(
                (item, index) => (
                  <li
                    key={`${item.dateKey}-${index}`}
                    className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-2.5"
                  >
                    <span className="text-xl">
                      {getActivityEmoji(
                        item.type,
                      )}
                    </span>

                    <span className="flex-1 font-bold text-zinc-700">
                      {item.type}
                    </span>

                    <span className="text-xs font-semibold text-zinc-400">
                      {item.duration} min ·{' '}
                      {formatShortDate(
                        item.dateKey,
                      )}
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-3 text-center">
      <p className="text-xl font-black text-zinc-800">
        {value}
      </p>

      <p className="text-xs font-semibold text-zinc-400">
        {label}
      </p>
    </div>
  )
}

export default MemberProfileModal
