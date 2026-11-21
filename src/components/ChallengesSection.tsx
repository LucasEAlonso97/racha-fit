import {
  useMemo,
  useState,
} from 'react'

import {
  Plus,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'

import CreateChallengeModal from './CreateChallengeModal'
import UserAvatar from './UserAvatar'

import {
  canStillComplete,
  countDays,
  getChallengeProgress,
  getChallengeStatus,
} from '../lib/challenges'

import type {
  Challenge,
  ChallengeMemberProgress,
  ChallengeStatus,
} from '../lib/challenges'

import {
  confirmAction,
} from '../lib/feedback'

import {
  formatDateKey,
  monthNames,
  parseDateKey,
} from '../utils/date'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  challenges: Challenge[]
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  today: Date
  onCreate: Parameters<
    typeof CreateChallengeModal
  >[0]['onCreate']
  onDelete: (
    challengeId: string,
  ) => Promise<boolean>
}

/*
 * Los terminados se siguen mostrando
 * una semana, para ver quién lo logró.
 */
const SHOW_FINISHED_DAYS = 7

function formatShortDate(
  dateKey: string,
) {
  const date = parseDateKey(dateKey)

  return `${date.getDate()} de ${monthNames[date.getMonth()]}`
}

/*
 * ========================================
 * DESAFÍOS (EN EL INICIO)
 * ========================================
 */

function ChallengesSection({
  challenges,
  activities,
  users,
  currentUserId,
  today,
  onCreate,
  onDelete,
}: Props) {
  const todayKey = formatDateKey(today)

  const [creating, setCreating] =
    useState(false)

  const [openId, setOpenId] = useState<
    string | null
  >(null)

  const visible = useMemo(
    () =>
      challenges
        .map((challenge) => ({
          challenge,
          status: getChallengeStatus(
            challenge,
            todayKey,
          ),
          progress:
            getChallengeProgress(
              challenge,
              activities,
              users,
            ),
        }))
        .filter(
          ({ challenge, status }) =>
            status !== 'finished' ||
            countDays(
              challenge.ends_on,
              todayKey,
            ) <=
              SHOW_FINISHED_DAYS + 1,
        )
        .sort((a, b) => {
          const order: Record<
            ChallengeStatus,
            number
          > = {
            active: 0,
            upcoming: 1,
            finished: 2,
          }

          return (
            order[a.status] -
              order[b.status] ||
            a.challenge.ends_on.localeCompare(
              b.challenge.ends_on,
            )
          )
        }),
    [
      challenges,
      activities,
      users,
      todayKey,
    ],
  )

  const opened = visible.find(
    (item) =>
      item.challenge.id === openId,
  )

  const activeToday =
    (activities[todayKey]?.[
      currentUserId
    ]?.length ?? 0) > 0

  return (
    <section className="mx-auto w-full max-w-md px-5 pt-4">
      {visible.length === 0 ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-4 rounded-[28px] border-2 border-dashed border-violet-200 bg-white p-4 text-left transition active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
            🏁
          </div>

          <div className="flex-1">
            <p className="font-black text-zinc-800">
              Armá un desafío
            </p>

            <p className="text-sm text-zinc-500">
              Ej: 20 días en el mes,
              todos juntos.
            </p>
          </div>

          <Plus
            size={20}
            className="text-violet-400"
          />
        </button>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <ChallengeCard
              key={item.challenge.id}
              challenge={item.challenge}
              status={item.status}
              progress={item.progress}
              currentUserId={
                currentUserId
              }
              todayKey={todayKey}
              activeToday={activeToday}
              onOpen={() =>
                setOpenId(
                  item.challenge.id,
                )
              }
            />
          ))}

          <button
            type="button"
            onClick={() =>
              setCreating(true)
            }
            className="flex w-full items-center justify-center gap-1 py-1 text-xs font-black text-violet-500"
          >
            <Plus size={14} />
            Nuevo desafío
          </button>
        </div>
      )}

      {creating && (
        <CreateChallengeModal
          today={today}
          onClose={() =>
            setCreating(false)
          }
          onCreate={onCreate}
        />
      )}

      {opened && (
        <ChallengeDetail
          challenge={opened.challenge}
          status={opened.status}
          progress={opened.progress}
          currentUserId={currentUserId}
          todayKey={todayKey}
          onClose={() => setOpenId(null)}
          onDelete={async () => {
            const confirmed =
              await confirmAction({
                title:
                  '¿Borrar el desafío?',
                message:
                  'Se borra para todo el grupo. Las actividades no se tocan.',
                confirmLabel: 'Borrar',
                danger: true,
              })

            if (!confirmed) {
              return
            }

            if (
              await onDelete(
                opened.challenge.id,
              )
            ) {
              setOpenId(null)
            }
          }}
        />
      )}
    </section>
  )
}

/*
 * ========================================
 * TARJETA
 * ========================================
 */

function ChallengeCard({
  challenge,
  status,
  progress,
  currentUserId,
  todayKey,
  activeToday,
  onOpen,
}: {
  challenge: Challenge
  status: ChallengeStatus
  progress: ChallengeMemberProgress[]
  currentUserId: string
  todayKey: string
  activeToday: boolean
  onOpen: () => void
}) {
  const mine = progress.find(
    (item) =>
      item.user.id === currentUserId,
  )

  const myDays = mine?.days ?? 0

  const percent = Math.min(
    100,
    Math.round(
      (myDays / challenge.target_days) *
        100,
    ),
  )

  const completedCount =
    progress.filter(
      (item) => item.completed,
    ).length

  const subtitle =
    status === 'upcoming'
      ? `Arranca el ${formatShortDate(challenge.starts_on)}`
      : status === 'finished'
        ? `Terminó el ${formatShortDate(challenge.ends_on)}`
        : (() => {
            const left = countDays(
              todayKey,
              challenge.ends_on,
            )

            return left === 1
              ? 'Último día'
              : `Quedan ${left} días`
          })()

  const reachable =
    mine?.completed ||
    canStillComplete(
      challenge,
      myDays,
      todayKey,
      activeToday,
    )

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-[28px] bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl">
          {status === 'finished'
            ? '🏆'
            : '🏁'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-zinc-800">
            {challenge.title}
          </p>

          <p className="text-xs font-semibold text-zinc-500">
            {challenge.target_days} días ·{' '}
            {subtitle}
          </p>
        </div>

        {completedCount > 0 && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">
            <Trophy size={12} />
            {completedCount}
          </span>
        )}
      </div>

      {status !== 'upcoming' && (
        <>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${
                mine?.completed
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
              }`}
              style={{
                width: `${percent}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs font-bold text-zinc-500">
            {mine?.completed
              ? '¡Lo lograste! 🎉'
              : status === 'finished'
                ? `Llegaste a ${myDays} de ${challenge.target_days}`
                : reachable
                  ? `Vas ${myDays} de ${challenge.target_days}`
                  : `Vas ${myDays} de ${challenge.target_days} · ya no llegás, ¡pero sumá igual!`}
          </p>
        </>
      )}
    </button>
  )
}

/*
 * ========================================
 * DETALLE (RANKING)
 * ========================================
 */

function ChallengeDetail({
  challenge,
  status,
  progress,
  currentUserId,
  todayKey,
  onClose,
  onDelete,
}: {
  challenge: Challenge
  status: ChallengeStatus
  progress: ChallengeMemberProgress[]
  currentUserId: string
  todayKey: string
  onClose: () => void
  onDelete: () => void
}) {
  const isCreator =
    challenge.created_by ===
    currentUserId

  const creator = progress.find(
    (item) =>
      item.user.id ===
      challenge.created_by,
  )?.user

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-white px-5 pb-8 pt-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-violet-500">
              {formatShortDate(
                challenge.starts_on,
              )}{' '}
              →{' '}
              {formatShortDate(
                challenge.ends_on,
              )}
            </p>

            <h2 className="text-2xl font-black text-zinc-800">
              {challenge.title}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Meta: {challenge.target_days}{' '}
              días con actividad
              {creator &&
                ` · lo creó ${creator.id === currentUserId ? 'vos' : creator.name}`}
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        {status === 'upcoming' && (
          <p className="mt-5 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-600">
            Arranca en{' '}
            {countDays(
              todayKey,
              challenge.starts_on,
            ) - 1}{' '}
            días. ¡Avisale al grupo! 📣
          </p>
        )}

        <ul className="mt-5 space-y-2">
          {progress.map((item, index) => {
            const percent = Math.min(
              100,
              Math.round(
                (item.days /
                  challenge.target_days) *
                  100,
              ),
            )

            return (
              <li
                key={item.user.id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  item.user.id ===
                  currentUserId
                    ? 'bg-violet-50'
                    : 'bg-zinc-50'
                }`}
              >
                <span className="w-6 text-center text-sm font-black text-zinc-400">
                  {item.completed
                    ? '🏆'
                    : index + 1}
                </span>

                <UserAvatar
                  user={item.user}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black text-zinc-800">
                      {item.user.id ===
                      currentUserId
                        ? 'Vos'
                        : item.user.name}
                    </p>

                    <p className="shrink-0 text-xs font-bold text-zinc-500">
                      {item.days}/
                      {challenge.target_days}
                    </p>
                  </div>

                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={`h-full rounded-full ${
                        item.completed
                          ? 'bg-emerald-500'
                          : 'bg-violet-400'
                      }`}
                      style={{
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {isCreator && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-6 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-zinc-400 hover:text-red-500"
          >
            <Trash2 size={16} />
            Borrar desafío
          </button>
        )}
      </div>
    </div>
  )
}

export default ChallengesSection
