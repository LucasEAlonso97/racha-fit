import {
  Pencil,
  Plus,
  X,
} from 'lucide-react'

import {
  getActivityEmoji,
} from '../data/activities'

import {
  monthNames,
  parseDateKey,
  weekDayNames,
} from '../utils/date'

import type {
  ActivitiesByDate,
  ReactionEmoji,
  User,
} from '../types'

import ActivityPhoto from './ActivityPhoto'
import CommentThread from './CommentThread'
import ReactionBar from './ReactionBar'
import PendingBadge from './PendingBadge'
import ActivityMoodNote from './ActivityMoodNote'
import UserAvatar from './UserAvatar'

import {
  openMemberProfile,
} from '../lib/socialPanels'

type Props = {
  dateKey: string | null
  todayKey: string

  activities: ActivitiesByDate
  users: User[]

  currentUserId: string

  wildcardBalance:
    number | null

  wildcardRecoveryDates:
    string[]

  onClose: () => void

  onEditActivity: (
    dateKey?: string,
    activityId?: string | null,
  ) => void

  onReactActivity: (
    activityId: string,
    emoji: ReactionEmoji,
  ) => void | Promise<void>

  onAddComment: (
    activityId: string,
    body: string,
  ) => Promise<boolean>

  onDeleteComment: (
    activityId: string,
    commentId: string,
  ) => void | Promise<void>
}

function DayDetailModal({
  dateKey,
  todayKey,
  activities,
  users,
  currentUserId,
  wildcardBalance,
  wildcardRecoveryDates,
  onClose,
  onEditActivity,
  onReactActivity,
  onAddComment,
  onDeleteComment,
}: Props) {
  if (!dateKey) {
    return null
  }

  /*
   * ========================================
   * FECHA
   * ========================================
   */

  const date =
    parseDateKey(
      dateKey,
    )

  const todayDate =
    parseDateKey(
      todayKey,
    )

  /*
   * ========================================
   * ACTIVIDADES DEL DÍA
   * ========================================
   */

  const dayActivities =
    activities[
      dateKey
    ] ?? {}

  const currentUserActivities =
    dayActivities[
      currentUserId
    ] ?? []

  const totalActivities =
    Object.values(
      dayActivities,
    ).reduce(
      (
        total,
        userActivities,
      ) =>
        total +
        userActivities.length,
      0,
    )

  const activeUserCount =
    users.filter(
      (user) =>
        (
          dayActivities[
            user.id
          ] ?? []
        ).length > 0,
    ).length

  /*
   * ========================================
   * ESTADO DE LA FECHA
   * ========================================
   */

  const isToday =
    dateKey ===
    todayKey

  const differenceInDays =
    Math.round(
      (
        todayDate.getTime() -
        date.getTime()
      ) /
        86400000,
    )

  const isPastDay =
    differenceInDays > 0

  const isRecoverablePastDay =
    differenceInDays >= 1 &&
    differenceInDays <= 7

  const isTooOld =
    differenceInDays > 7

  const isFuture =
    differenceInDays < 0

  /*
   * ========================================
   * COMODINES
   * ========================================
   */

  const dayAlreadyRecovered =
    wildcardRecoveryDates.includes(
      dateKey,
    )

  const wildcardsLoading =
    wildcardBalance ===
    null

  const hasWildcard =
    (
      wildcardBalance ??
      0
    ) > 0

  const needsWildcard =
    isRecoverablePastDay &&
    currentUserActivities.length ===
      0 &&
    !dayAlreadyRecovered

  const canAddActivity =
    isToday ||
    (
      isRecoverablePastDay &&
      (
        currentUserActivities.length >
          0 ||
        dayAlreadyRecovered ||
        hasWildcard
      )
    )

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-white">
  <div className="h-[100dvh] w-full max-w-md overflow-y-auto overscroll-contain bg-white px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold capitalize text-violet-500">
              {
                weekDayNames[
                  date.getDay()
                ]
              }
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {date.getDate()}{' '}
              de{' '}
              {
                monthNames[
                  date.getMonth()
                ]
              }
            </h2>

            {totalActivities >
              0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {
                  activeUserCount
                }{' '}
                {activeUserCount ===
                1
                  ? 'persona activa'
                  : 'personas activas'}
                {' · '}
                {
                  totalActivities
                }{' '}
                {totalActivities ===
                1
                  ? 'actividad'
                  : 'actividades'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-95"
          >
            <X
              size={20}
            />
          </button>
        </div>

        {/* ================================= */}
        {/* DÍA RECUPERADO */}
        {/* ================================= */}

        {dayAlreadyRecovered && (
          <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold text-amber-700">
              🃏 Día recuperado
            </p>

            <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-600">
              Recuperado con comodín.
            </p>
          </div>
        )}

        {/* ================================= */}
        {/* VACÍO */}
        {/* ================================= */}

        {totalActivities ===
          0 && (
          <div className="mb-5 rounded-[24px] bg-zinc-50 px-5 py-8 text-center">
            <div className="text-4xl">
              {isRecoverablePastDay
                ? '🃏'
                : '👀'}
            </div>

            <p className="mt-3 font-bold text-zinc-700">
              {isRecoverablePastDay
                ? 'Este día quedó vacío'
                : 'Nadie se movió todavía'}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {isRecoverablePastDay
                ? 'Si entrenaste y te olvidaste de cargarlo, todavía podés recuperarlo.'
                : 'La cadena puede empezar acá.'}
            </p>
          </div>
        )}

        {/* ================================= */}
        {/* USUARIOS */}
        {/* ================================= */}

        <div className="space-y-4">
          {users.map(
            (user) => {
              const userActivities =
                dayActivities[
                  user.id
                ] ?? []

              const isCurrentUser =
                user.id ===
                currentUserId

              const hasActivities =
                userActivities.length >
                0

              return (
                <section
                  key={
                    user.id
                  }
                  className={`rounded-[24px] p-4 ${
                    isCurrentUser
                      ? 'bg-violet-50'
                      : 'bg-zinc-50'
                  }`}
                >
                  {/* USER */}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Ver perfil de ${user.name}`}
                      onClick={() =>
                        openMemberProfile(
                          user.id,
                        )
                      }
                      className="shrink-0 transition active:scale-95"
                    >
                      <UserAvatar
                        user={
                          user
                        }
                        size="lg"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-zinc-800">
                          {isCurrentUser
                            ? 'Vos'
                            : user.name}
                        </p>

                        {hasActivities && (
                          <span className="text-lg">
                            🔥
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-semibold text-zinc-500">
                        {hasActivities
                          ? `${
                              userActivities.length
                            } ${
                              userActivities.length ===
                              1
                                ? 'actividad'
                                : 'actividades'
                            }`
                          : 'Sin actividad'}
                      </p>
                    </div>
                  </div>

                  {/* ================================= */}
                  {/* ACTIVIDADES */}
                  {/* ================================= */}

                  {hasActivities && (
                    <div className="mt-4 space-y-3">
                      {userActivities.map(
                        (
                          activity,
                          index,
                        ) => {
                          const activityKey =
                            activity.id ??
                            `${activity.type}-${index}`

                          return (
                            <div
                              key={
                                activityKey
                              }
                              className="rounded-2xl bg-white p-3 shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                {/* ICONO */}

                                <div
                                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                                    isCurrentUser
                                      ? 'bg-violet-100'
                                      : 'bg-zinc-100'
                                  }`}
                                >
                                  {getActivityEmoji(
                                    activity.type,
                                  )}
                                </div>

                                {/* INFO */}

                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-zinc-800">
                                    {
                                      activity.type
                                    }
                                  </p>

                                  <p className="mt-0.5 text-sm text-zinc-500">
                                    {
                                      activity.duration
                                    }{' '}
                                    min
                                  </p>

                                  <ActivityMoodNote
                                    mood={activity.mood}
                                    note={activity.note}
                                  />

                                  {activity.recovered_with_wildcard && (
                                    <p className="mt-1 text-xs font-bold text-amber-600">
                                      🃏 Día
                                      recuperado
                                    </p>
                                  )}

                                  {activity.pending && (
                                    <PendingBadge />
                                  )}
                                </div>

                                {/* EDITAR */}

                                {isCurrentUser &&
                                  activity.id && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onEditActivity(
                                          dateKey,
                                          activity.id ??
                                            null,
                                        )
                                      }
                                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition active:scale-95"
                                    >
                                      <Pencil
                                        size={
                                          16
                                        }
                                      />
                                    </button>
                                  )}
                              </div>

                              {/* FOTO */}

                              {activity.photo_url && (
                                <ActivityPhoto
                                  url={
                                    activity.photo_url
                                  }
                                  alt={`${activity.type} de ${user.name}`}
                                />
                              )}

                              {/* REACCIONES */}

                              {activity.id &&
                                !activity.pending && (
                                <ReactionBar
                                  reactions={
                                    activity.reactions ??
                                    []
                                  }
                                  currentUserId={
                                    currentUserId
                                  }
                                  onReact={(
                                    emoji,
                                  ) =>
                                    onReactActivity(
                                      activity.id!,
                                      emoji,
                                    )
                                  }
                                />
                              )}

                              {/* COMENTARIOS */}

                              {activity.id &&
                                !activity.pending && (
                                <CommentThread
                                  comments={
                                    activity.comments ??
                                    []
                                  }
                                  users={users}
                                  currentUserId={
                                    currentUserId
                                  }
                                  onAdd={(body) =>
                                    onAddComment(
                                      activity.id!,
                                      body,
                                    )
                                  }
                                  onDelete={(
                                    commentId,
                                  ) =>
                                    onDeleteComment(
                                      activity.id!,
                                      commentId,
                                    )
                                  }
                                />
                              )}
                            </div>
                          )
                        },
                      )}
                    </div>
                  )}
                </section>
              )
            },
          )}
        </div>

        {/* ================================= */}
        {/* HOY */}
        {/* ================================= */}

        {isToday && (
          <>
            <button
              type="button"
              onClick={() =>
                onEditActivity(
                  dateKey,
                  null,
                )
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
            >
              <Plus
                size={20}
                strokeWidth={3}
              />

              {currentUserActivities.length >
              0
                ? 'Agregar otra actividad'
                : 'Sumar mi actividad'}
            </button>

            {currentUserActivities.length >
              1 && (
              <p className="mt-3 text-center text-xs font-semibold text-violet-400">
                Hiciste{' '}
                {
                  currentUserActivities.length
                }{' '}
                actividades hoy.
                Igual suma 1 día a
                tu racha 🔥
              </p>
            )}
          </>
        )}

        {/* ================================= */}
        {/* DÍA PASADO RECUPERABLE */}
        {/* ================================= */}

        {isRecoverablePastDay && (
          <>
            <button
              type="button"
              onClick={() =>
                onEditActivity(
                  dateKey,
                  null,
                )
              }
              disabled={
                !canAddActivity ||
                (
                  needsWildcard &&
                  wildcardsLoading
                )
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-bold text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
            >
              <Plus
                size={20}
                strokeWidth={3}
              />

              {currentUserActivities.length >
                0 ||
              dayAlreadyRecovered
                ? 'Agregar otra actividad'
                : wildcardsLoading
                  ? 'Cargando comodines...'
                  : hasWildcard
                    ? '🃏 Recuperar este día'
                    : 'Sin comodines disponibles'}
            </button>

            {/* AVISO DE CONSUMO */}

            {needsWildcard &&
              hasWildcard &&
              !wildcardsLoading && (
                <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3">
                  <p className="text-center text-xs font-bold leading-relaxed text-amber-700">
                    🃏 Usarás 1 de tus{' '}
                    {
                      wildcardBalance
                    }{' '}
                    {wildcardBalance ===
                    1
                      ? 'comodín'
                      : 'comodines'}{' '}
                    para recuperar
                    este día.
                  </p>
                </div>
              )}

            {/* SIN COMODINES */}

            {needsWildcard &&
              !hasWildcard &&
              !wildcardsLoading && (
                <p className="mt-3 text-center text-xs font-semibold leading-relaxed text-zinc-500">
                  No te quedan comodines.
                </p>
              )}

            {/* YA RECUPERADO */}

            {dayAlreadyRecovered &&
              currentUserActivities.length >
                0 && (
                <p className="mt-3 text-center text-xs font-bold leading-relaxed text-amber-600">
                  🃏 Sumar otra no gasta otro comodín.
                </p>
              )}
          </>
        )}

        {/* ================================= */}
        {/* DÍA DEMASIADO ANTIGUO */}
        {/* ================================= */}

        {isTooOld && (
          <div className="mt-6 rounded-2xl bg-zinc-100 px-4 py-3 text-center">
            <p className="text-sm font-bold text-zinc-500">
              Este día ya no se
              puede recuperar
            </p>

            <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500">
              Solo se recuperan los últimos 7 días.
            </p>
          </div>
        )}

        {/* ================================= */}
        {/* FUTURO */}
        {/* ================================= */}

        {isFuture && (
          <div className="mt-6 rounded-2xl bg-zinc-100 px-4 py-3 text-center">
            <p className="text-sm font-bold text-zinc-500">
              Todavía no llegamos
              acá 😅
            </p>

            <p className="mt-1 text-xs font-semibold text-zinc-500">
              No se pueden cargar
              actividades futuras.
            </p>
          </div>
        )}

        {/* ================================= */}
        {/* ACLARACIÓN */}
        {/* ================================= */}

        {isPastDay &&
          isRecoverablePastDay &&
          currentUserActivities.length >
            1 && (
            <p className="mt-3 text-center text-xs font-semibold text-zinc-500">
              Tenés{' '}
              {
                currentUserActivities.length
              }{' '}
              actividades en este
              día. Para la racha
              sigue contando una
              sola vez.
            </p>
          )}
      </div>
    </div>
  )
}

export default DayDetailModal