import {
  useMemo,
  useState,
} from 'react'

import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Share2,
} from 'lucide-react'

import UserAvatar from './UserAvatar'

import {
  activityOptions,
} from '../data/activities'

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
  formatMinutes,
  getPeriodSummary,
  shiftPeriod,
} from '../utils/periodSummary'

import type {
  Period,
  PeriodKind,
} from '../utils/periodSummary'

import type {
  ActivitiesByDate,
  ActivityType,
  User,
} from '../types'

type Props = {
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
}

const medals = ['🥇', '🥈', '🥉']

function getActivityEmoji(
  type: ActivityType | null,
) {
  return (
    activityOptions.find(
      (option) => option.name === type,
    )?.emoji ?? '✨'
  )
}

function capitalize(text: string) {
  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  )
}

/*
 * ========================================
 * RESUMEN MENSUAL / ANUAL
 * ========================================
 */

function PeriodSummary({
  activities,
  users,
  currentUserId,
  today,
}: Props) {
  const [period, setPeriod] =
    useState<Period>({
      kind: 'month',
      year: today.getFullYear(),
      month: today.getMonth(),
    })

  const summary = useMemo(
    () =>
      getPeriodSummary(
        activities,
        users,
        period,
      ),
    [activities, users, period],
  )

  const isCurrentPeriod =
    period.year ===
      today.getFullYear() &&
    (period.kind === 'year' ||
      period.month === today.getMonth())

  const periodLabel =
    period.kind === 'year'
      ? String(period.year)
      : `${capitalize(monthNames[period.month])} ${period.year}`

  const mySummary =
    summary.members.find(
      (member) =>
        member.user.id === currentUserId,
    )

  const [sharing, setSharing] =
    useState(false)

  const shareSummary = async () => {
    if (!mySummary || sharing) {
      return
    }

    setSharing(true)

    try {
      const blob = await drawSummaryCard({
        subtitle:
          period.kind === 'year'
            ? 'Mi año en Racha'
            : 'Mi mes en Racha',
        title: periodLabel,
        stats: [
          {
            value: String(
              mySummary.activeDays,
            ),
            label:
              mySummary.activeDays === 1
                ? 'día activo'
                : 'días activos',
          },
          {
            value: formatMinutes(
              mySummary.totalMinutes,
            ),
            label: 'en movimiento',
          },
          {
            value: getActivityEmoji(
              mySummary.favoriteType,
            ),
            label:
              mySummary.favoriteType ??
              'favorita',
          },
          {
            value: `🔥 ${mySummary.bestStreak}`,
            label: 'mejor racha',
          },
        ],
      })

      const result = await shareImage(
        blob,
        `racha-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.png`,
        `Mi ${period.kind === 'year' ? 'año' : 'mes'} en Racha 🔥`,
      )

      if (result === 'downloaded') {
        showToast(
          'Imagen descargada. Subila a tu historia 📲',
          'success',
        )
      }
    } catch (error) {
      console.error(
        'Error compartiendo resumen:',
        error,
      )

      showToast(
        'No pudimos generar la imagen.',
      )
    } finally {
      setSharing(false)
    }
  }

  const changeKind = (
    kind: PeriodKind,
  ) => {
    setPeriod((current) => ({
      ...current,
      kind,
    }))
  }

  return (
    <div className="space-y-5 pb-5">
      {/* SELECTOR DE PERÍODO */}

      <section className="rounded-[28px] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
          {(
            [
              ['month', 'Mes'],
              ['year', 'Año'],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() =>
                changeKind(kind)
              }
              className={`rounded-xl py-2 text-sm font-black transition ${
                period.kind === kind
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() =>
              setPeriod((current) =>
                shiftPeriod(current, -1),
              )
            }
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <ChevronLeft size={20} />
          </button>

          <p className="text-lg font-black text-zinc-800">
            {periodLabel}
          </p>

          <button
            type="button"
            aria-label="Período siguiente"
            disabled={isCurrentPeriod}
            onClick={() =>
              setPeriod((current) =>
                shiftPeriod(current, 1),
              )
            }
            className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* TU PERÍODO */}

      {mySummary && (
        <section className="rounded-[28px] bg-gradient-to-br from-violet-500 to-pink-500 p-5 text-white shadow-sm">
          <p className="text-sm font-bold opacity-80">
            {period.kind === 'year'
              ? 'Tu año en Racha'
              : 'Tu mes en Racha'}
          </p>

          {mySummary.activeDays === 0 ? (
            <p className="mt-3 text-lg font-black">
              Todavía no hay actividad
              en este período. ¡Un día
              más cuenta! 💪
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryStat
                value={String(
                  mySummary.activeDays,
                )}
                label={
                  mySummary.activeDays === 1
                    ? 'día activo'
                    : 'días activos'
                }
              />

              <SummaryStat
                value={formatMinutes(
                  mySummary.totalMinutes,
                )}
                label="en movimiento"
              />

              <SummaryStat
                value={`${getActivityEmoji(mySummary.favoriteType)} ${mySummary.favoriteType ?? ''}`}
                label="tu favorita"
              />

              <SummaryStat
                value={`🔥 ${mySummary.bestStreak}`}
                label="mejor racha"
              />
            </div>
          )}

          {mySummary.activeDays > 0 && (
            <button
              type="button"
              disabled={sharing}
              onClick={() =>
                void shareSummary()
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-violet-600 transition active:scale-[0.98] disabled:opacity-70"
            >
              {sharing ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Share2 size={18} />
              )}
              Compartir en historias
            </button>
          )}
        </section>
      )}

      {/* EL GRUPO */}

      <section className="rounded-[28px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-zinc-800">
          La banda
        </h2>

        {summary.activeDays === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">
            Nadie registró actividad
            en este período.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500">
              {summary.activeDays}{' '}
              {summary.activeDays === 1
                ? 'día'
                : 'días'}{' '}
              con alguien moviéndose ·{' '}
              {formatMinutes(
                summary.totalMinutes,
              )}{' '}
              entre todos
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {summary.favoriteType && (
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-600">
                  {getActivityEmoji(
                    summary.favoriteType,
                  )}{' '}
                  Lo más hecho:{' '}
                  {summary.favoriteType}
                </span>
              )}

              {summary.busiestWeekDay !==
                null && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                  📅 Día más activo:{' '}
                  {
                    weekDayNames[
                      summary.busiestWeekDay
                    ]
                  }
                </span>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {summary.members.map(
                (member, index) => (
                  <div
                    key={member.user.id}
                    className={`flex items-center gap-3 rounded-2xl p-3 ${
                      member.user.id ===
                      currentUserId
                        ? 'bg-violet-50'
                        : 'bg-zinc-50'
                    }`}
                  >
                    <div className="w-8 text-center text-xl">
                      {member.activeDays > 0
                        ? (medals[index] ??
                          `${index + 1}.`)
                        : '·'}
                    </div>

                    <UserAvatar
                      user={member.user}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-zinc-800">
                        {member.user.id ===
                        currentUserId
                          ? 'Vos'
                          : member.user.name}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-500">
                        {member.activeDays}{' '}
                        {member.activeDays === 1
                          ? 'día'
                          : 'días'}{' '}
                        ·{' '}
                        {formatMinutes(
                          member.totalMinutes,
                        )}
                      </p>
                    </div>

                    {member.favoriteType && (
                      <span
                        className="text-xl"
                        title={
                          member.favoriteType
                        }
                      >
                        {getActivityEmoji(
                          member.favoriteType,
                        )}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function SummaryStat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-3">
      <p className="truncate text-xl font-black">
        {value}
      </p>

      <p className="text-xs font-semibold opacity-80">
        {label}
      </p>
    </div>
  )
}

export default PeriodSummary
