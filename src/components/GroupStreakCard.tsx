import {
  Check,
  Flame,
  LoaderCircle,
  Send,
  Target,
} from 'lucide-react'

import {
  useGroupNudges,
} from '../hooks/useGroupNudges'

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
   * PROGRESO GENERAL
   * ========================================
   */

  const totalGoal =
    eligibleMemberProgress.reduce(
      (
        total,
        member,
      ) =>
        total +
        member.goal,
      0,
    )

  /*
   * Una persona no puede compensar
   * lo que le falta a otra.
   *
   * Si alguien hace 6/4,
   * aporta máximo 4 al objetivo grupal.
   */

  const totalCompleted =
    eligibleMemberProgress.reduce(
      (
        total,
        member,
      ) =>
        total +
        Math.min(
          member.completedDays,
          member.goal,
        ),
      0,
    )

  const totalRemaining =
    eligibleMemberProgress.reduce(
      (
        total,
        member,
      ) =>
        total +
        member.remaining,
      0,
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
   * QUIÉNES FALTAN
   * ========================================
   */

  const pendingMembers =
    eligibleMemberProgress.filter(
      member =>
        !member.completed,
    )

  /*
   * ========================================
   * ÚLTIMO PENDIENTE
   * ========================================
   */

  const lastPendingMember =
    pendingMembers.length ===
    1
      ? pendingMembers[
          0
        ]
      : null

  /*
   * ========================================
   * ¿TODOS CUMPLIERON?
   * ========================================
   */

  const everybodyCompleted =
    eligibleMemberProgress.length >
      0 &&
    completedMembers ===
      eligibleMemberProgress.length

  /*
   * ========================================
   * PORCENTAJE GRUPAL
   * ========================================
   */

  const groupProgress =
    totalGoal >
    0
      ? Math.min(
          (
            totalCompleted /
            totalGoal
          ) *
            100,
          100,
        )
      : 0

  /*
   * ========================================
   * LA BANDA HOY
   * ========================================
   *
   * Acá SÍ contamos a todos.
   *
   * Aunque alguien todavía no cuente
   * para la racha semanal, sigue siendo
   * parte del grupo y puede entrenar.
   * ========================================
   */

  const activeToday =
    memberProgress.filter(
      member =>
        member.activeToday,
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
        window.alert(
          'Ya se movió hoy 💪',
        )
      }

      if (
        result ===
        'error'
      ) {
        window.alert(
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
    <section
      className={`mb-5 overflow-hidden rounded-[30px] shadow-sm ${
        everybodyCompleted
          ? 'bg-gradient-to-br from-orange-50 via-amber-50 to-violet-50'
          : lastPendingMember
            ? 'bg-gradient-to-br from-pink-50 via-violet-50 to-orange-50'
            : 'bg-gradient-to-br from-violet-100 via-violet-50 to-pink-50'
      }`}
    >
      <div className="p-5">
        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.14em] text-violet-500">
              RACHA DEL GRUPO
            </p>

            <div className="mt-2 flex items-center gap-2">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  everybodyCompleted
                    ? 'bg-orange-100 text-orange-500'
                    : 'bg-white/80 text-violet-500'
                }`}
              >
                <Flame
                  size={
                    24
                  }
                  className={
                    everybodyCompleted
                      ? 'fill-orange-400'
                      : ''
                  }
                />
              </div>

              <div>
                <h2 className="text-xl font-black text-zinc-800">
                  {everybodyCompleted
                    ? 'Semana salvada 🔥'
                    : 'Semana en juego'}
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                  Todos tienen que
                  llegar a su meta
                </p>
              </div>
            </div>
          </div>

          {/* ================================= */}
          {/* CUMPLIERON */}
          {/* ================================= */}

          <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-center shadow-sm">
            <p className="text-xl font-black text-violet-600">
              {
                completedMembers
              }
              /
              {
                eligibleMemberProgress.length
              }
            </p>

            <p className="text-[10px] font-black text-zinc-400">
              CUMPLIERON
            </p>
          </div>
        </div>

        {/* ================================= */}
        {/* PROGRESO GENERAL */}
        {/* ================================= */}

        <div className="mt-5">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-500">
                Progreso de la
                banda
              </p>

              <p className="mt-0.5 text-sm font-black text-zinc-700">
                {
                  totalCompleted
                }{' '}
                de{' '}
                {
                  totalGoal
                }{' '}
                días
              </p>
            </div>

            <p className="text-lg font-black text-violet-600">
              {Math.round(
                groupProgress,
              )}
              %
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                everybodyCompleted
                  ? 'bg-orange-400'
                  : lastPendingMember
                    ? 'bg-pink-400'
                    : 'bg-violet-500'
              }`}
              style={{
                width:
                  `${groupProgress}%`,
              }}
            />
          </div>
        </div>

        {/* ================================= */}
        {/* MENSAJE PRINCIPAL */}
        {/* ================================= */}

        <div
          className={`mt-4 rounded-2xl px-4 py-3 ${
            everybodyCompleted
              ? 'bg-orange-100/70'
              : lastPendingMember
                ? 'bg-pink-100/80'
                : 'bg-white/70'
          }`}
        >
          {everybodyCompleted ? (
            /*
             * ========================================
             * TODOS CUMPLIERON
             * ========================================
             */

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-400 text-white">
                <Check
                  size={
                    18
                  }
                  strokeWidth={
                    3
                  }
                />
              </div>

              <div>
                <p className="text-sm font-black text-orange-700">
                  Todos llegaron.
                </p>

                <p className="mt-0.5 text-xs font-semibold text-orange-600">
                  Esta semana ya está
                  salvada.
                </p>
              </div>
            </div>
          ) : lastPendingMember ? (
            /*
             * ========================================
             * QUEDA UNO SOLO
             * ========================================
             */

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-500 text-lg text-white">
                👀
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-pink-700">
                  {lastPendingMember
                    .user
                    .id ===
                  currentUserId
                    ? 'Todo depende de vos 👀'
                    : `Todo depende de ${lastPendingMember.user.name} 👀`}
                </p>

                <p className="mt-0.5 text-xs font-semibold text-pink-600">
                  {lastPendingMember
                    .user
                    .id ===
                  currentUserId
                    ? lastPendingMember.remaining ===
                      1
                      ? 'Te falta 1 día para salvar la semana.'
                      : `Te faltan ${lastPendingMember.remaining} días para salvar la semana.`
                    : lastPendingMember.remaining ===
                        1
                      ? 'Le falta 1 día para salvar la semana.'
                      : `Le faltan ${lastPendingMember.remaining} días para salvar la semana.`}
                </p>
              </div>
            </div>
          ) : (
            /*
             * ========================================
             * FALTAN VARIOS
             * ========================================
             */

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Target
                  size={
                    18
                  }
                />
              </div>

              <div>
                <p className="text-sm font-black text-zinc-700">
                  {totalRemaining ===
                  1
                    ? 'Falta 1 día entre todos.'
                    : `Faltan ${totalRemaining} días entre todos.`}
                </p>

                <p className="mt-0.5 text-xs font-semibold text-zinc-500">
                  Que nadie quede
                  atrás.
                </p>
              </div>
            </div>
          )}
        </div>

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

              const isLastPending =
                member.eligibleThisWeek &&
                lastPendingMember
                  ?.user.id ===
                  member.user.id

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
                        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-pink-500 text-[9px]">
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
                            <p className="truncate text-sm font-black text-zinc-800">
                              {isMe
                                ? 'Vos'
                                : member.user.name}
                            </p>

                            {!member.eligibleThisWeek && (
                              <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[8px] font-black tracking-wide text-violet-500">
                                NUEVO
                              </span>
                            )}
                          </div>

                          {isLastPending && (
                            <p className="mt-0.5 text-[9px] font-black tracking-wide text-pink-500">
                              ÚLTIMO PENDIENTE
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`text-sm font-black ${
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
                          className={`text-[10px] font-bold ${
                            !member.eligibleThisWeek
                              ? 'text-violet-400'
                              : isLastPending
                                ? 'text-pink-500'
                                : 'text-zinc-400'
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
                          <span className="text-[10px] font-black text-green-500">
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
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition active:scale-[0.98] ${
                        alreadySent
                          ? 'bg-zinc-100 text-zinc-400'
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

      {/* ================================= */}
      {/* LA BANDA HOY */}
      {/* ================================= */}

      <div className="border-t border-white/70 bg-white/40 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-zinc-700">
              LA BANDA HOY
            </p>

            <p className="mt-1 text-xs font-semibold text-zinc-500">
              {users.length ===
              0
                ? 'Todavía no hay integrantes.'
                : activeToday ===
                    users.length
                  ? 'Todos ya se movieron 💪'
                  : activeToday ===
                      0
                    ? 'Todavía nadie sumó hoy.'
                    : `${activeToday} de ${users.length} ya se movieron.`}
            </p>
          </div>

          {/* ================================= */}
          {/* AVATARES DINÁMICOS */}
          {/* ================================= */}

          <div className="flex -space-x-2">
            {memberProgress
              .slice(
                0,
                6,
              )
              .map(
                member => (
                  <div
                    key={
                      member.user.id
                    }
                    className={`rounded-full ${
                      member.activeToday
                        ? 'opacity-100'
                        : 'opacity-30 grayscale'
                    }`}
                  >
                    <UserAvatar
                      user={
                        member.user
                      }
                      size="sm"
                    />
                  </div>
                ),
              )}

            {memberProgress.length >
              6 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-[10px] font-black text-violet-600">
                +
                {
                  memberProgress.length -
                  6
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default GroupStreakCard