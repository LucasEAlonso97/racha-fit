import {
  Award,
  Bike,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Medal,
  Star,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'

import type {
  LucideIcon,
} from 'lucide-react'

import {
  useState,
} from 'react'

import type {
  ActivitiesByDate,
} from '../types'

import {
  getBestStreak,
} from '../utils/activityStats'

type Props = {
  activities: ActivitiesByDate
  currentUserId: string
}

type Achievement = {
  id: string
  title: string
  description: string
  current: number
  goal: number
  icon: LucideIcon
}

const achievementsPerPage = 6

function Achievements({
  activities,
  currentUserId,
}: Props) {
  const [
    currentPage,
    setCurrentPage,
  ] = useState(0)

  /*
   * ========================================
   * ESTADÍSTICAS GENERALES
   * ========================================
   */

  const activeDays =
    Object.keys(
      activities,
    ).filter(
      (dateKey) =>
        (
          activities[
            dateKey
          ]?.[
            currentUserId
          ] ?? []
        ).length > 0,
    ).length

  const userActivities =
    Object.values(
      activities,
    ).flatMap(
      (day) =>
        day[
          currentUserId
        ] ?? [],
    )

  const totalActivities =
    userActivities.length

  const totalMinutes =
    userActivities.reduce(
      (
        total,
        activity,
      ) =>
        total +
        activity.duration,
      0,
    )

  const bestStreak =
    getBestStreak(
      activities,
      currentUserId,
    )

  /*
   * ========================================
   * ACTIVIDADES POR TIPO
   * ========================================
   */

  const gymCount =
    userActivities.filter(
      (activity) =>
        activity.type ===
        'Gym',
    ).length

  const walkingCount =
    userActivities.filter(
      (activity) =>
        activity.type ===
        'Caminata',
    ).length

  const runningCount =
    userActivities.filter(
      (activity) =>
        activity.type ===
        'Correr',
    ).length

  const cyclingCount =
    userActivities.filter(
      (activity) =>
        activity.type ===
        'Bicicleta',
    ).length

  /*
   * ========================================
   * LOGROS
   * ========================================
   */

  const achievements:
    Achievement[] = [
      /*
       * ====================================
       * PRIMEROS PASOS
       * ====================================
       */

      {
        id: 'first-activity',
        title:
          'Primera actividad',
        description:
          'Registraste tu primer movimiento.',
        current:
          totalActivities,
        goal: 1,
        icon: Dumbbell,
      },

      {
        id: 'three-days',
        title:
          'Ya arrancaste',
        description:
          'Sumaste movimiento en 3 días.',
        current:
          activeDays,
        goal: 3,
        icon: CalendarCheck2,
      },

      {
        id: 'three-streak',
        title:
          'En racha',
        description:
          'Llegaste a 3 días seguidos.',
        current:
          bestStreak,
        goal: 3,
        icon: Flame,
      },

      {
        id: 'ten-activities',
        title:
          'Diez y contando',
        description:
          'Registraste 10 actividades.',
        current:
          totalActivities,
        goal: 10,
        icon: Medal,
      },

      {
        id: 'five-hours',
        title:
          'Cinco horas',
        description:
          'Acumulaste 300 minutos moviéndote.',
        current:
          totalMinutes,
        goal: 300,
        icon: Timer,
      },

      {
        id: 'seven-streak',
        title:
          'Una semana entera',
        description:
          'Mantuviste una racha de 7 días.',
        current:
          bestStreak,
        goal: 7,
        icon: Trophy,
      },

      /*
       * ====================================
       * CONSTANCIA
       * ====================================
       */

      {
        id: 'twenty-five-activities',
        title:
          'No aflojás',
        description:
          'Registraste 25 actividades.',
        current:
          totalActivities,
        goal: 25,
        icon: Dumbbell,
      },

      {
        id: 'ten-active-days',
        title:
          'Diez días',
        description:
          'Te moviste en 10 días distintos.',
        current:
          activeDays,
        goal: 10,
        icon: CalendarCheck2,
      },

      {
        id: 'ten-hours',
        title:
          'Diez horas',
        description:
          'Acumulaste 600 minutos moviéndote.',
        current:
          totalMinutes,
        goal: 600,
        icon: Timer,
      },

      {
        id: 'fourteen-streak',
        title:
          'Dos semanas',
        description:
          'Llegaste a 14 días seguidos.',
        current:
          bestStreak,
        goal: 14,
        icon: Flame,
      },

      {
        id: 'fifty-activities',
        title:
          'Imparable',
        description:
          'Registraste 50 actividades.',
        current:
          totalActivities,
        goal: 50,
        icon: Medal,
      },

      {
        id: 'thirty-active-days',
        title:
          'Un mes en movimiento',
        description:
          'Te moviste en 30 días distintos.',
        current:
          activeDays,
        goal: 30,
        icon: Trophy,
      },

      /*
       * ====================================
       * ACTIVIDADES ACUMULADAS
       * ====================================
       */

      {
        id: 'seventy-five-activities',
        title:
          'Modo constante',
        description:
          'Registraste 75 actividades.',
        current:
          totalActivities,
        goal: 75,
        icon: Award,
      },

      {
        id: 'hundred-activities',
        title:
          'Centenario',
        description:
          'Llegaste a 100 actividades.',
        current:
          totalActivities,
        goal: 100,
        icon: Trophy,
      },

      {
        id: 'two-hundred-activities',
        title:
          'Máquina',
        description:
          'Registraste 200 actividades.',
        current:
          totalActivities,
        goal: 200,
        icon: Crown,
      },

      {
        id: 'three-sixty-five-activities',
        title:
          'No parás más',
        description:
          'Llegaste a 365 actividades.',
        current:
          totalActivities,
        goal: 365,
        icon: Star,
      },

      /*
       * ====================================
       * DÍAS ACTIVOS
       * ====================================
       */

      {
        id: 'fifty-active-days',
        title:
          '50 días sumando',
        description:
          'Te moviste en 50 días distintos.',
        current:
          activeDays,
        goal: 50,
        icon: CalendarCheck2,
      },

      {
        id: 'hundred-active-days',
        title:
          '100 días',
        description:
          'Llegaste a 100 días activos.',
        current:
          activeDays,
        goal: 100,
        icon: CalendarCheck2,
      },

      {
        id: 'one-eighty-active-days',
        title:
          'Medio año',
        description:
          'Sumaste movimiento en 180 días.',
        current:
          activeDays,
        goal: 180,
        icon: Award,
      },

      {
        id: 'three-sixty-five-active-days',
        title:
          '365 días sumando',
        description:
          'Te moviste en 365 días distintos.',
        current:
          activeDays,
        goal: 365,
        icon: Crown,
      },

      /*
       * ====================================
       * TIEMPO ACUMULADO
       * ====================================
       */

      {
        id: 'twenty-hours',
        title:
          '20 horas',
        description:
          'Acumulaste 1.200 minutos moviéndote.',
        current:
          totalMinutes,
        goal: 1200,
        icon: Timer,
      },

      {
        id: 'fifty-hours',
        title:
          '50 horas',
        description:
          'Acumulaste 3.000 minutos.',
        current:
          totalMinutes,
        goal: 3000,
        icon: Timer,
      },

      {
        id: 'hundred-hours',
        title:
          '100 horas',
        description:
          'Acumulaste 6.000 minutos en movimiento.',
        current:
          totalMinutes,
        goal: 6000,
        icon: Award,
      },

      {
        id: 'two-hundred-hours',
        title:
          '200 horas',
        description:
          'Acumulaste 12.000 minutos.',
        current:
          totalMinutes,
        goal: 12000,
        icon: Crown,
      },

      /*
       * ====================================
       * RACHAS GRANDES
       * ====================================
       */

      {
        id: 'twenty-one-streak',
        title:
          'Tres semanas',
        description:
          'Llegaste a 21 días seguidos.',
        current:
          bestStreak,
        goal: 21,
        icon: Flame,
      },

      {
        id: 'thirty-streak',
        title:
          'Un mes sin cortar',
        description:
          'Mantuviste una racha de 30 días.',
        current:
          bestStreak,
        goal: 30,
        icon: Flame,
      },

      {
        id: 'sixty-streak',
        title:
          'Dos meses',
        description:
          'Llegaste a 60 días seguidos.',
        current:
          bestStreak,
        goal: 60,
        icon: Trophy,
      },

      {
        id: 'hundred-streak',
        title:
          'Racha legendaria',
        description:
          'Alcanzaste 100 días seguidos.',
        current:
          bestStreak,
        goal: 100,
        icon: Crown,
      },

      /*
       * ====================================
       * GYM
       * ====================================
       */

      {
        id: 'ten-gym',
        title:
          'Modo gym',
        description:
          'Registraste 10 sesiones de Gym.',
        current:
          gymCount,
        goal: 10,
        icon: Dumbbell,
      },

      {
        id: 'twenty-five-gym',
        title:
          'Fierros',
        description:
          'Registraste 25 sesiones de Gym.',
        current:
          gymCount,
        goal: 25,
        icon: Dumbbell,
      },

      /*
       * ====================================
       * CAMINATA
       * ====================================
       */

      {
        id: 'ten-walks',
        title:
          'Paso a paso',
        description:
          'Registraste 10 caminatas.',
        current:
          walkingCount,
        goal: 10,
        icon: Footprints,
      },

      {
        id: 'twenty-five-walks',
        title:
          'Caminante',
        description:
          'Registraste 25 caminatas.',
        current:
          walkingCount,
        goal: 25,
        icon: Footprints,
      },

      /*
       * ====================================
       * CORRER
       * ====================================
       */

      {
        id: 'ten-runs',
        title:
          'A correr',
        description:
          'Registraste 10 salidas a correr.',
        current:
          runningCount,
        goal: 10,
        icon: Zap,
      },

      {
        id: 'twenty-five-runs',
        title:
          'Corredor constante',
        description:
          'Registraste 25 salidas a correr.',
        current:
          runningCount,
        goal: 25,
        icon: Zap,
      },

      /*
       * ====================================
       * BICICLETA
       * ====================================
       */

      {
        id: 'ten-rides',
        title:
          'Sobre ruedas',
        description:
          'Registraste 10 actividades en bicicleta.',
        current:
          cyclingCount,
        goal: 10,
        icon: Bike,
      },

      {
        id: 'twenty-five-rides',
        title:
          'A puro pedal',
        description:
          'Registraste 25 actividades en bicicleta.',
        current:
          cyclingCount,
        goal: 25,
        icon: Bike,
      },
    ]

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
        achievement.current >=
        achievement.goal,
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
            <p className="text-xs font-black tracking-wider text-violet-500">
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
          <p className="text-xs font-bold text-zinc-400">
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

      {/* LOGROS */}

      <div className="grid grid-cols-2 gap-3">
        {visibleAchievements.map(
          (achievement) => {
            const unlocked =
              achievement.current >=
              achievement.goal

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
                      : 'bg-zinc-200 text-zinc-400'
                  }`}
                >
                  <Icon
                    size={20}
                  />
                </div>

                {/* TEXTO */}

                <h3
                  className={`mt-3 text-sm font-black ${
                    unlocked
                      ? 'text-zinc-800'
                      : 'text-zinc-500'
                  }`}
                >
                  {
                    achievement.title
                  }
                </h3>

                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-400">
                  {
                    achievement.description
                  }
                </p>

                {/* ESTADO */}

                {unlocked ? (
                  <p className="mt-3 text-[11px] font-black text-violet-600">
                    Desbloqueado
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

                    <p className="mt-1.5 text-[10px] font-bold text-zinc-400">
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