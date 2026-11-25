import type {
  LucideIcon,
} from 'lucide-react'

import {
  Award,
  Bike,
  CalendarCheck2,
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
  ActivitiesByDate,
} from '../types'

import {
  getBestStreak,
} from './activityStats'

/*
 * ========================================
 * LOGROS
 * ========================================
 *
 * La misma lista está en la base, en
 * achievement_catalog() (migración
 * 20261125180000_logros_con_regalos.sql),
 * que es la que verifica al reclamar. Si se
 * agrega o cambia un logro, hay que
 * cambiarlo en los dos lados.
 *
 * Regalos según dificultad:
 *   easy   -> nada
 *   medium -> 1 comodín
 *   hard   -> 1 comodín + corona 7 días
 */

export type AchievementMetric =
  | 'activities'
  | 'days'
  | 'minutes'
  | 'streak'
  | 'gym'
  | 'walks'
  | 'runs'
  | 'rides'

export type AchievementTier =
  | 'easy'
  | 'medium'
  | 'hard'

export type AchievementDefinition = {
  id: string
  title: string
  description: string
  metric: AchievementMetric
  goal: number
  icon: LucideIcon
  tier: AchievementTier
}

export type Achievement =
  AchievementDefinition & {
    current: number
    unlocked: boolean
  }

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-activity',
    title: 'Primera actividad',
    description: 'Registraste tu primer movimiento.',
    metric: 'activities',
    goal: 1,
    icon: Dumbbell,
    tier: 'easy',
  },
  {
    id: 'three-days',
    title: 'Ya arrancaste',
    description: 'Sumaste movimiento en 3 días.',
    metric: 'days',
    goal: 3,
    icon: CalendarCheck2,
    tier: 'easy',
  },
  {
    id: 'three-streak',
    title: 'En racha',
    description: 'Llegaste a 3 días seguidos.',
    metric: 'streak',
    goal: 3,
    icon: Flame,
    tier: 'easy',
  },
  {
    id: 'ten-activities',
    title: 'Diez y contando',
    description: 'Registraste 10 actividades.',
    metric: 'activities',
    goal: 10,
    icon: Medal,
    tier: 'easy',
  },
  {
    id: 'five-hours',
    title: 'Cinco horas',
    description: 'Acumulaste 300 minutos moviéndote.',
    metric: 'minutes',
    goal: 300,
    icon: Timer,
    tier: 'easy',
  },
  {
    id: 'seven-streak',
    title: 'Una semana entera',
    description: 'Mantuviste una racha de 7 días.',
    metric: 'streak',
    goal: 7,
    icon: Trophy,
    tier: 'medium',
  },
  {
    id: 'twenty-five-activities',
    title: 'No aflojás',
    description: 'Registraste 25 actividades.',
    metric: 'activities',
    goal: 25,
    icon: Dumbbell,
    tier: 'medium',
  },
  {
    id: 'ten-active-days',
    title: 'Diez días',
    description: 'Te moviste en 10 días distintos.',
    metric: 'days',
    goal: 10,
    icon: CalendarCheck2,
    tier: 'easy',
  },
  {
    id: 'ten-hours',
    title: 'Diez horas',
    description: 'Acumulaste 600 minutos moviéndote.',
    metric: 'minutes',
    goal: 600,
    icon: Timer,
    tier: 'medium',
  },
  {
    id: 'fourteen-streak',
    title: 'Dos semanas',
    description: 'Llegaste a 14 días seguidos.',
    metric: 'streak',
    goal: 14,
    icon: Flame,
    tier: 'medium',
  },
  {
    id: 'fifty-activities',
    title: 'Imparable',
    description: 'Registraste 50 actividades.',
    metric: 'activities',
    goal: 50,
    icon: Medal,
    tier: 'medium',
  },
  {
    id: 'thirty-active-days',
    title: 'Un mes en movimiento',
    description: 'Te moviste en 30 días distintos.',
    metric: 'days',
    goal: 30,
    icon: Trophy,
    tier: 'medium',
  },
  {
    id: 'seventy-five-activities',
    title: 'Modo constante',
    description: 'Registraste 75 actividades.',
    metric: 'activities',
    goal: 75,
    icon: Award,
    tier: 'medium',
  },
  {
    id: 'hundred-activities',
    title: 'Centenario',
    description: 'Llegaste a 100 actividades.',
    metric: 'activities',
    goal: 100,
    icon: Trophy,
    tier: 'medium',
  },
  {
    id: 'two-hundred-activities',
    title: 'Máquina',
    description: 'Registraste 200 actividades.',
    metric: 'activities',
    goal: 200,
    icon: Crown,
    tier: 'medium',
  },
  {
    id: 'three-sixty-five-activities',
    title: 'No parás más',
    description: 'Llegaste a 365 actividades.',
    metric: 'activities',
    goal: 365,
    icon: Star,
    tier: 'hard',
  },
  {
    id: 'fifty-active-days',
    title: '50 días sumando',
    description: 'Te moviste en 50 días distintos.',
    metric: 'days',
    goal: 50,
    icon: CalendarCheck2,
    tier: 'medium',
  },
  {
    id: 'hundred-active-days',
    title: '100 días',
    description: 'Llegaste a 100 días activos.',
    metric: 'days',
    goal: 100,
    icon: CalendarCheck2,
    tier: 'hard',
  },
  {
    id: 'one-eighty-active-days',
    title: 'Medio año',
    description: 'Sumaste movimiento en 180 días.',
    metric: 'days',
    goal: 180,
    icon: Award,
    tier: 'hard',
  },
  {
    id: 'three-sixty-five-active-days',
    title: '365 días sumando',
    description: 'Te moviste en 365 días distintos.',
    metric: 'days',
    goal: 365,
    icon: Crown,
    tier: 'hard',
  },
  {
    id: 'twenty-hours',
    title: '20 horas',
    description: 'Acumulaste 1.200 minutos moviéndote.',
    metric: 'minutes',
    goal: 1200,
    icon: Timer,
    tier: 'medium',
  },
  {
    id: 'fifty-hours',
    title: '50 horas',
    description: 'Acumulaste 3.000 minutos.',
    metric: 'minutes',
    goal: 3000,
    icon: Timer,
    tier: 'medium',
  },
  {
    id: 'hundred-hours',
    title: '100 horas',
    description: 'Acumulaste 6.000 minutos en movimiento.',
    metric: 'minutes',
    goal: 6000,
    icon: Award,
    tier: 'hard',
  },
  {
    id: 'two-hundred-hours',
    title: '200 horas',
    description: 'Acumulaste 12.000 minutos.',
    metric: 'minutes',
    goal: 12000,
    icon: Crown,
    tier: 'hard',
  },
  {
    id: 'twenty-one-streak',
    title: 'Tres semanas',
    description: 'Llegaste a 21 días seguidos.',
    metric: 'streak',
    goal: 21,
    icon: Flame,
    tier: 'medium',
  },
  {
    id: 'thirty-streak',
    title: 'Un mes sin cortar',
    description: 'Mantuviste una racha de 30 días.',
    metric: 'streak',
    goal: 30,
    icon: Flame,
    tier: 'hard',
  },
  {
    id: 'sixty-streak',
    title: 'Dos meses',
    description: 'Llegaste a 60 días seguidos.',
    metric: 'streak',
    goal: 60,
    icon: Trophy,
    tier: 'hard',
  },
  {
    id: 'hundred-streak',
    title: 'Racha legendaria',
    description: 'Alcanzaste 100 días seguidos.',
    metric: 'streak',
    goal: 100,
    icon: Crown,
    tier: 'hard',
  },
  {
    id: 'ten-gym',
    title: 'Modo gym',
    description: 'Registraste 10 sesiones de Gym.',
    metric: 'gym',
    goal: 10,
    icon: Dumbbell,
    tier: 'medium',
  },
  {
    id: 'twenty-five-gym',
    title: 'Fierros',
    description: 'Registraste 25 sesiones de Gym.',
    metric: 'gym',
    goal: 25,
    icon: Dumbbell,
    tier: 'medium',
  },
  {
    id: 'ten-walks',
    title: 'Paso a paso',
    description: 'Registraste 10 caminatas.',
    metric: 'walks',
    goal: 10,
    icon: Footprints,
    tier: 'medium',
  },
  {
    id: 'twenty-five-walks',
    title: 'Caminante',
    description: 'Registraste 25 caminatas.',
    metric: 'walks',
    goal: 25,
    icon: Footprints,
    tier: 'medium',
  },
  {
    id: 'ten-runs',
    title: 'A correr',
    description: 'Registraste 10 salidas a correr.',
    metric: 'runs',
    goal: 10,
    icon: Zap,
    tier: 'medium',
  },
  {
    id: 'twenty-five-runs',
    title: 'Corredor constante',
    description: 'Registraste 25 salidas a correr.',
    metric: 'runs',
    goal: 25,
    icon: Zap,
    tier: 'medium',
  },
  {
    id: 'ten-rides',
    title: 'Sobre ruedas',
    description: 'Registraste 10 actividades en bicicleta.',
    metric: 'rides',
    goal: 10,
    icon: Bike,
    tier: 'medium',
  },
  {
    id: 'twenty-five-rides',
    title: 'A puro pedal',
    description: 'Registraste 25 actividades en bicicleta.',
    metric: 'rides',
    goal: 25,
    icon: Bike,
    tier: 'medium',
  },
]

export function tierHasGift(
  tier: AchievementTier,
) {
  return tier !== 'easy'
}

export function giftLabel(
  tier: AchievementTier,
) {
  if (tier === 'hard') {
    return '1 comodín + corona 7 días'
  }

  if (tier === 'medium') {
    return '1 comodín'
  }

  return null
}

export function getAchievementMetrics(
  activities: ActivitiesByDate,
  userId: string,
): Record<AchievementMetric, number> {
  const userActivities = Object.values(
    activities,
  ).flatMap(
    (day) => day[userId] ?? [],
  )

  const countType = (type: string) =>
    userActivities.filter(
      (activity) => activity.type === type,
    ).length

  return {
    activities: userActivities.length,
    days: Object.keys(activities).filter(
      (dateKey) =>
        (activities[dateKey]?.[userId] ??
          []).length > 0,
    ).length,
    minutes: userActivities.reduce(
      (total, activity) =>
        total + activity.duration,
      0,
    ),
    streak: getBestStreak(
      activities,
      userId,
    ),
    gym: countType('Gym'),
    walks: countType('Caminata'),
    runs: countType('Correr'),
    rides: countType('Bicicleta'),
  }
}

export function getAchievements(
  activities: ActivitiesByDate,
  userId: string,
): Achievement[] {
  const metrics = getAchievementMetrics(
    activities,
    userId,
  )

  return ACHIEVEMENTS.map(
    (achievement) => {
      const current =
        metrics[achievement.metric]

      return {
        ...achievement,
        current,
        unlocked:
          current >= achievement.goal,
      }
    },
  )
}

/*
 * Cumplidos, con regalo y sin reclamar.
 */
export function getClaimableAchievements(
  achievements: Achievement[],
  claimed: Set<string>,
) {
  return achievements.filter(
    (achievement) =>
      achievement.unlocked &&
      tierHasGift(achievement.tier) &&
      !claimed.has(achievement.id),
  )
}
