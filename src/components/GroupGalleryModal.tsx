import {
  useMemo,
} from 'react'

import {
  X,
} from 'lucide-react'

import ActivityPhoto from './ActivityPhoto'

import {
  activityOptions,
} from '../data/activities'

import {
  collectPhotos,
} from '../lib/activityState'

import type {
  PhotoItem,
} from '../lib/activityState'

import {
  monthNames,
  parseDateKey,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  groupName: string
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  onClose: () => void
}

function capitalize(text: string) {
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  )
}

/*
 * ========================================
 * GALERÍA DEL GRUPO
 * ========================================
 *
 * Todas las fotos, agrupadas por mes.
 */

function GroupGalleryModal({
  groupName,
  activities,
  users,
  currentUserId,
  onClose,
}: Props) {
  const months = useMemo(() => {
    const byMonth = new Map<
      string,
      PhotoItem[]
    >()

    collectPhotos(activities).forEach(
      (photo) => {
        const monthKey =
          photo.dateKey.slice(0, 7)

        const list =
          byMonth.get(monthKey) ?? []

        list.push(photo)
        byMonth.set(monthKey, list)
      },
    )

    return [...byMonth.entries()]
  }, [activities])

  const getUserName = (
    userId: string,
  ) =>
    userId === currentUserId
      ? 'Vos'
      : (users.find(
          (user) => user.id === userId,
        )?.name ?? 'Alguien')

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-violet-500">
              {groupName}
            </p>

            <h1 className="text-3xl font-black text-zinc-800">
              Fotos 📸
            </h1>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </header>

        {months.length === 0 ? (
          <div className="rounded-[28px] bg-zinc-50 px-5 py-10 text-center">
            <p className="text-4xl">
              📷
            </p>

            <p className="mt-3 font-bold text-zinc-700">
              Todavía no hay fotos
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Sumá una cuando registres
              tu próxima actividad.
            </p>
          </div>
        ) : (
          months.map(([monthKey, photos]) => {
            const date = parseDateKey(
              `${monthKey}-01`,
            )

            return (
              <section
                key={monthKey}
                className="mb-6"
              >
                <h2 className="mb-3 text-sm font-bold text-zinc-500">
                  {capitalize(
                    monthNames[
                      date.getMonth()
                    ],
                  )}{' '}
                  {date.getFullYear()} ·{' '}
                  {photos.length}{' '}
                  {photos.length === 1
                    ? 'foto'
                    : 'fotos'}
                </h2>

                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => {
                    const emoji =
                      activityOptions.find(
                        (option) =>
                          option.name ===
                          photo.activity.type,
                      )?.emoji ?? '✨'

                    const day =
                      parseDateKey(
                        photo.dateKey,
                      ).getDate()

                    return (
                      <ActivityPhoto
                        key={photo.activity.id ?? photo.url}
                        url={photo.url}
                        variant="square"
                        alt={`${photo.activity.type} de ${getUserName(photo.userId)}`}
                        caption={`${getUserName(photo.userId)} · ${emoji} ${photo.activity.type} · ${day} de ${monthNames[date.getMonth()]}`}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GroupGalleryModal
