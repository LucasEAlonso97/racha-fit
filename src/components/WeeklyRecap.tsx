import {
  useMemo,
  useState,
} from 'react'

import UserAvatar from './UserAvatar'

import StoriesShell, {
  Big,
  Kicker,
  Line,
  Note,
  ShareFooter,
  SummaryBox,
  type Slide,
} from './StoriesShell'

import {
  getActivityEmoji,
} from '../data/activities'

import {
  showToast,
} from '../lib/feedback'

import {
  getMood,
} from '../lib/moods'

import {
  drawSummaryCard,
  shareImage,
} from '../lib/shareCards'

import {
  parseDateKey,
  weekDayNames,
} from '../utils/date'

import {
  computeWeekRecap,
} from '../utils/weeklyRecap'

import {
  formatHours,
} from '../utils/wrapped'

import type {
  ActivitiesByDate,
  User,
} from '../types'

type Props = {
  weekStart: Date
  groupName: string
  activities: ActivitiesByDate
  users: User[]
  currentUserId: string
  onClose: () => void
}

/*
 * ========================================
 * TU SEMANA EN 10 SEGUNDOS
 * ========================================
 *
 * Aparece una vez por semana, al abrir la
 * app, con la semana que terminó.
 */
function WeeklyRecap({
  weekStart,
  groupName,
  activities,
  users,
  currentUserId,
  onClose,
}: Props) {
  const [sharing, setSharing] =
    useState(false)

  const recap = useMemo(
    () =>
      computeWeekRecap(
        activities,
        users,
        currentUserId,
        weekStart,
      ),
    [
      activities,
      users,
      currentUserId,
      weekStart,
    ],
  )

  const share = async () => {
    setSharing(true)

    try {
      const blob =
        await drawSummaryCard({
          title: 'Mi semana en Racha',
          subtitle: recap.rangeLabel,
          stats: [
            {
              value: `${recap.days}/${recap.goal}`,
              label: recap.goalMet
                ? 'meta cumplida ✅'
                : 'días de mi meta',
            },
            {
              value: String(recap.minutes),
              label: 'minutos',
            },
            {
              value: String(
                recap.activitiesCount,
              ),
              label: 'actividades',
            },
            {
              value:
                recap.topSport ?? '—',
              label: 'deporte top',
            },
          ],
        })

      const result = await shareImage(
        blob,
        `racha-semana-${recap.weekStart}.png`,
        `Mi semana en Racha: ${recap.days} días 🔥`,
      )

      if (result === 'downloaded') {
        showToast(
          'Imagen descargada. ¡Subila a tus historias!',
          'success',
        )
      }
    } catch (error) {
      console.error(
        'Error compartiendo la semana:',
        error,
      )

      showToast(
        'No pudimos armar la imagen.',
      )
    } finally {
      setSharing(false)
    }
  }

  const delta =
    recap.days - recap.previousDays

  const mood = getMood(recap.topMood)

  const slides: Slide[] = [
    {
      id: 'intro',
      background:
        'from-violet-600 via-indigo-500 to-sky-400',
      content: (
        <>
          <p className="text-7xl">⚡</p>
          <p className="mt-6 text-5xl font-black leading-[1.05]">
            Tu semana
            <br />
            en 10 segundos
          </p>
          <Note>
            Del {recap.rangeLabel} en{' '}
            <b>{groupName}</b>. Tocá para
            avanzar.
          </Note>
        </>
      ),
    },
    {
      id: 'days',
      background: recap.goalMet
        ? 'from-emerald-500 via-teal-500 to-violet-500'
        : 'from-fuchsia-600 via-pink-500 to-orange-400',
      content: (
        <>
          <Kicker>Entrenaste</Kicker>
          <div className="mt-4">
            <Big>{recap.days}</Big>
          </div>
          <Line>
            {recap.days === 1
              ? 'día'
              : 'días'}{' '}
            de tu meta de {recap.goal}{' '}
            {recap.goalMet ? '✅' : ''}
          </Line>
          <Note>
            {recap.goalMet
              ? '¡Meta cumplida! '
              : recap.days === 0
                ? 'Semana floja, pasa. Esta arrancamos de nuevo. '
                : `Te ${recap.goal - recap.days === 1 ? 'faltó 1 día' : `faltaron ${recap.goal - recap.days} días`}. `}
            {recap.minutes > 0 &&
              `Sumaste ${recap.minutes} minutos (${formatHours(recap.minutes)} h). `}
            {delta > 0 &&
              `${delta} ${delta === 1 ? 'día' : 'días'} más que la semana anterior 📈`}
          </Note>
        </>
      ),
    },
  ]

  if (recap.bestDay) {
    const date = parseDateKey(
      recap.bestDay.dateKey,
    )

    slides.push({
      id: 'best',
      background:
        'from-orange-500 via-amber-400 to-pink-500',
      content: (
        <>
          <Kicker>Tu mejor día</Kicker>
          <p className="mt-6 text-[96px] leading-none">
            {getActivityEmoji(
              recap.bestDay.type,
            )}
          </p>
          <p className="mt-4 text-5xl font-black capitalize">
            {weekDayNames[date.getDay()]}
          </p>
          <Note>
            {recap.bestDay.minutes} minutos
            de {recap.bestDay.type}.
            {mood &&
              ` Y en general te sentiste: ${mood.emoji} ${mood.label}.`}
          </Note>
        </>
      ),
    })
  }

  if (recap.group.members > 1) {
    slides.push({
      id: 'group',
      background:
        'from-violet-600 via-purple-500 to-pink-500',
      content: (
        <>
          <Kicker>En {groupName}</Kicker>
          <div className="mt-4">
            <Big>
              {recap.group.membersMet}/
              {recap.group.members}
            </Big>
          </div>
          <Line>cumplieron la meta</Line>

          {recap.group.mvp && (
            <div className="mt-8 flex items-center justify-center gap-3 rounded-3xl bg-white/15 px-4 py-3">
              <UserAvatar
                user={recap.group.mvp.user}
                size="md"
              />
              <p className="text-left text-sm font-bold leading-snug">
                👑{' '}
                {recap.group.mvp.user.id ===
                currentUserId
                  ? 'Vos'
                  : recap.group.mvp.user.name}{' '}
                {recap.group.mvp.user.id ===
                currentUserId
                  ? 'fuiste'
                  : 'fue'}{' '}
                quien más se movió:{' '}
                {recap.group.mvp.days}{' '}
                {recap.group.mvp.days === 1
                  ? 'día'
                  : 'días'}
              </p>
            </div>
          )}

          <Note>
            Entre todos sumaron{' '}
            <b>
              {recap.group.totalDays} días
            </b>{' '}
            de entrenamiento.
          </Note>
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
        <p className="text-6xl">💪</p>
        <p className="mt-4 text-4xl font-black leading-tight">
          ¡A por esta semana!
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <SummaryBox
            value={`${recap.days}/${recap.goal}`}
            label="días"
          />
          <SummaryBox
            value={String(recap.minutes)}
            label="minutos"
          />
        </div>

        <ShareFooter
          sharing={sharing}
          onShare={() => void share()}
          onClose={onClose}
        />
      </>
    ),
  })

  return (
    <StoriesShell
      title="Tu semana"
      label="Tu semana en Racha"
      slides={slides}
      onClose={onClose}
    />
  )
}

export default WeeklyRecap
