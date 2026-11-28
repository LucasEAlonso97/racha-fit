import {
  useState,
} from 'react'

import {
  Check,
  ChevronDown,
  LoaderCircle,
  Send,
} from 'lucide-react'


import {
  useGroupNudges,
} from '../hooks/useGroupNudges'

import {
  showToast,
} from '../lib/feedback'

import UserAvatar from './UserAvatar'

import {
  getWeekActivityCount,
} from '../utils/activityStats'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  groupId: string

  activities:
    ActivitiesByDate

  users:
    User[]

  currentUserId:
    string

  today:
    Date
}

function GroupStreakCard({
  groupId,
  activities,
  users,
  currentUserId,
  today,
}: Props) {
  /*
   * Plegada de entrada: se ve el resumen y
   * se abre para ver a cada uno.
   */
  const [expanded, setExpanded] =
    useState(false)

  /*
   * ========================================
   * EMPUJONES
   * ========================================
   */

  const {
    sentTo,
    sendingTo,
    sendNudge,
  } =
    useGroupNudges(
      groupId,
      currentUserId,
    )

  /*
   * ========================================
   * FECHA DE HOY
   * ========================================
   */

  const todayKey =
    [
      today.getFullYear(),

      String(
        today.getMonth() +
          1,
      ).padStart(
        2,
        '0',
      ),

      String(
        today.getDate(),
      ).padStart(
        2,
        '0',
      ),
    ].join(
      '-',
    )

  /*
   * ========================================
   * LUNES DE ESTA SEMANA
   * ========================================
   */

  const weekStart =
    new Date(
      today,
    )

  weekStart.setHours(
    12,
    0,
    0,
    0,
  )

  const weekDay =
    weekStart.getDay()

  const distanceToMonday =
    weekDay === 0
      ? -6
      : 1 - weekDay

  weekStart.setDate(
    weekStart.getDate() +
      distanceToMonday,
  )

  const currentWeekStartKey =
    [
      weekStart.getFullYear(),

      String(
        weekStart.getMonth() +
          1,
      ).padStart(
        2,
        '0',
      ),

      String(
        weekStart.getDate(),
      ).padStart(
        2,
        '0',
      ),
    ].join(
      '-',
    )

  /*
   * ========================================
   * PROGRESO DE CADA INTEGRANTE
   * ========================================
   *
   * SIEMPRE recorremos users.
   *
   * Por eso cualquier persona nueva
   * aparece automáticamente.
   *
   * streakEligibleFrom solamente determina
   * si cuenta o no para la racha grupal
   * de ESTA semana.
   * ========================================
   */

  const memberProgress =
    users.map(
      user => {
        const goal =
          user.weeklyGoal ??
          4

        const completedDays =
          getWeekActivityCount(
            activities,
            user.id,
            today,
          )

        const remaining =
          Math.max(
            goal -
              completedDays,
            0,
          )

        const completed =
          completedDays >=
          goal

        const progress =
          Math.min(
            (
              completedDays /
              goal
            ) *
              100,
            100,
          )

        const activeToday =
          (
            activities[
              todayKey
            ]?.[
              user.id
            ] ?? []
          ).length >
          0

        /*
         * ========================================
         * ¿CUENTA PARA LA RACHA ESTA SEMANA?
         * ========================================
         *
         * Ejemplo:
         *
         * Semana actual:
         * 31/08
         *
         * Darío se suma:
         * 03/09
         *
         * streakEligibleFrom:
         * 07/09
         *
         * 07/09 > 31/08
         *
         * Entonces esta semana NO cuenta.
         * ========================================
         */

        const eligibleThisWeek =
          !user.streakEligibleFrom ||
          user.streakEligibleFrom <=
            currentWeekStartKey

        return {
          user,
          goal,
          completedDays,
          remaining,
          completed,
          progress,
          activeToday,
          eligibleThisWeek,
        }
      },
    )

  /*
   * ========================================
   * MIEMBROS QUE CUENTAN ESTA SEMANA
   * ========================================
   */

  const eligibleMemberProgress =
    memberProgress.filter(
      member =>
        member.eligibleThisWeek,
    )

  /*
   * ========================================
   * QUIÉNES CUMPLIERON
   * ========================================
   */

  const completedMembers =
    eligibleMemberProgress.filter(
      member =>
        member.completed,
    ).length

  /*
   * ========================================
   * EMPUJAR
   * ========================================
   */

  const handleNudge =
    async (
      userId: string,
    ) => {
      const result =
        await sendNudge(
          userId,
        )

      if (
        result ===
        'already_active'
      ) {
        showToast(
          'Ya se movió hoy 💪',
          'info',
        )
      }

      if (
        result ===
        'error'
      ) {
        showToast(
          'No pudimos mandar el empujón.',
        )
      }
    }

  /*
   * ========================================
   * UI
   * ========================================
   */

  return (
    <section className="mb-5 overflow-hidden rounded-[28px] bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() =>
          setExpanded((current) => !current)
        }
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wider text-violet-500">
            ESTA SEMANA
          </p>

          <h2 className="mt-1 text-xl font-black text-zinc-800">
            {completedMembers} de{' '}
            {eligibleMemberProgress.length}{' '}
            llegaron a su meta
          </h2>
        </div>

        <div className="flex shrink-0 -space-x-2">
          {memberProgress
            .slice(0, 4)
            .map((member) => (
              <span
                key={member.user.id}
                className={`rounded-full ring-2 ${
                  member.remaining === 0
                    ? 'ring-green-400'
                    : 'ring-white'
                }`}
              >
                <UserAvatar
                  user={member.user}
                  size="sm"
                />
              </span>
            ))}
        </div>

        <ChevronDown
          size={20}
          className={`shrink-0 text-zinc-500 transition ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5">
        {/* ================================= */}
        {/* PERSONAS DEL GRUPO */}
        {/* ================================= */}

        <div className="mt-5 space-y-3">
          {memberProgress.map(
            member => {
              const isMe =
                member.user.id ===
                currentUserId

              /*
               * ========================================
               * EMPUJÓN DISPONIBLE
               * ========================================
               *
               * Solo si YA está compitiendo
               * por la racha esta semana.
               */

              const nudgeAvailable =
                member.eligibleThisWeek &&
                !isMe &&
                !member.completed &&
                !member.activeToday

              const alreadySent =
                sentTo.has(
                  member.user.id,
                )

              const sending =
                sendingTo ===
                member.user.id

              /*
               * ========================================
               * ÚLTIMO PENDIENTE
               * ========================================
               */

              /*
               * Sin objetivo en común: nadie es
               * "el último que falta".
               */
              const isLastPending = false

              return (
                <div
                  key={
                    member.user.id
                  }
                  className={`rounded-[20px] p-3.5 transition ${
                    !member.eligibleThisWeek
                      ? 'bg-white/60 ring-1 ring-violet-100'
                      : isLastPending
                        ? 'bg-pink-50 ring-1 ring-pink-100'
                        : 'bg-white/80'
                  }`}
                >
                  {/* ================================= */}
                  {/* PERSONA */}
                  {/* ================================= */}

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar
                        user={
                          member.user
                        }
                        size="md"
                      />

                      {isLastPending && (
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-pink-500 text-xs">
                          👀
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* ================================= */}
                      {/* NOMBRE + PROGRESO */}
                      {/* ================================= */}

                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-zinc-800">
                              {isMe
                                ? 'Vos'
                                : member.user.name}
                            </p>

                            {!member.eligibleThisWeek && (
                              <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold tracking-wide text-violet-500">
                                NUEVO
                              </span>
                            )}
                          </div>

                          {isLastPending && (
                            <p className="mt-0.5 text-xs font-bold tracking-wide text-pink-500">
                              ÚLTIMO PENDIENTE
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              !member.eligibleThisWeek
                                ? 'text-violet-400'
                                : member.completed
                                  ? 'text-green-600'
                                  : isLastPending
                                    ? 'text-pink-600'
                                    : 'text-zinc-600'
                            }`}
                          >
                            {
                              member.completedDays
                            }
                            /
                            {
                              member.goal
                            }
                          </span>

                          {member.completed &&
                            member.eligibleThisWeek && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Check
                                  size={
                                    12
                                  }
                                  strokeWidth={
                                    3
                                  }
                                />
                              </div>
                            )}
                        </div>
                      </div>

                      {/* ================================= */}
                      {/* BARRA */}
                      {/* ================================= */}

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            !member.eligibleThisWeek
                              ? 'bg-violet-200'
                              : member.completed
                                ? 'bg-green-400'
                                : isLastPending
                                  ? 'bg-pink-400'
                                  : 'bg-violet-400'
                          }`}
                          style={{
                            width:
                              `${member.progress}%`,
                          }}
                        />
                      </div>

                      {/* ================================= */}
                      {/* ESTADO */}
                      {/* ================================= */}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p
                          className={`text-xs font-bold ${
                            !member.eligibleThisWeek
                              ? 'text-violet-400'
                              : isLastPending
                                ? 'text-pink-500'
                                : 'text-zinc-500'
                          }`}
                        >
                          {!member.eligibleThisWeek
                            ? 'Se suma a la racha el lunes'
                            : member.completed
                              ? 'Meta cumplida'
                              : member.remaining ===
                                  1
                                ? 'Le falta 1 día'
                                : `Le faltan ${member.remaining} días`}
                        </p>

                        {member.activeToday && (
                          <span className="text-xs font-bold text-green-500">
                            HOY ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ================================= */}
                  {/* EMPUJÓN */}
                  {/* ================================= */}

                  {nudgeAvailable && (
                    <button
                      type="button"
                      disabled={
                        alreadySent ||
                        sending
                      }
                      onClick={() =>
                        void handleNudge(
                          member.user.id,
                        )
                      }
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition active:scale-[0.98] ${
                        alreadySent
                          ? 'bg-zinc-100 text-zinc-500'
                          : isLastPending
                            ? 'bg-pink-500 text-white'
                            : 'bg-violet-100 text-violet-600'
                      }`}
                    >
                      {sending ? (
                        <>
                          <LoaderCircle
                            size={
                              15
                            }
                            className="animate-spin"
                          />

                          Mandando...
                        </>
                      ) : alreadySent ? (
                        <>
                          <Check
                            size={
                              15
                            }
                          />

                          Empujón enviado 👊
                        </>
                      ) : isLastPending ? (
                        <>
                          <Send
                            size={
                              15
                            }
                          />

                          Dale, te necesitamos 👊
                        </>
                      ) : (
                        <>
                          <Send
                            size={
                              15
                            }
                          />

                          Dale, faltás vos 👊
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            },
          )}
        </div>
        </div>
      )}
    </section>
  )
}

export default GroupStreakCard