import {
  supabase,
} from './supabase'

/*
 * ========================================
 * PREMIOS DE TORNEO
 * ========================================
 *
 * Las listas de apodos y mensajes tienen
 * que ser IGUALES a las de la base
 * (tournament_nickname_options y
 * tournament_megaphone_options en
 * supabase/migrations/20261121200000_...).
 */

export type PrizeType =
  | 'wildcard'
  | 'crown'
  | 'nickname'
  | 'next_selector'
  | 'megaphone'

export const NICKNAME_OPTIONS = [
  'El del sillón 🛋️',
  'Promesa del running 🏃',
  'Leyenda del gym 💪',
  'Modo tortuga 🐢',
  'Rey del descanso 😴',
  'Máquina imparable 🚂',
  'Experto en excusas 🙃',
  'Influencer fitness 📸',
  'Atleta de fin de semana 📅',
  'El que nunca falla 🎯',
]

export const MEGAPHONE_OPTIONS = [
  'Esta semana no se corta 🔥',
  'Los estoy mirando 👀',
  '¿Y la actividad de hoy? 🤨',
  'El campeón les manda saludos 👑',
  'Acá nadie se queda atrás 💪',
  'Hoy se entrena, mañana se presume 😎',
]

/*
 * Texto del botón y de la confirmación
 * según el tipo de premio.
 */
export const PRIZE_COPY: Record<
  PrizeType,
  {
    claimLabel: string
    claimedText: string
  }
> = {
  wildcard: {
    claimLabel: 'Reclamar mi comodín',
    claimedText: '¡Sumaste 1 comodín! 🃏',
  },
  crown: {
    claimLabel: 'Ponerme la corona',
    claimedText: '¡Tenés la corona por 7 días! 👑',
  },
  nickname: {
    claimLabel: 'Elegir apodo',
    claimedText: '¡Apodo puesto por 7 días! 🏷️',
  },
  next_selector: {
    claimLabel: 'Reclamar el próximo torneo',
    claimedText: '¡La próxima carta la elegís vos! 🎴',
  },
  megaphone: {
    claimLabel: 'Usar el megáfono',
    claimedText: '¡Tu mensaje está en el inicio de todos! 📣',
  },
}

export function isPrizeType(
  value: unknown,
): value is PrizeType {
  return (
    typeof value === 'string' &&
    value in PRIZE_COPY
  )
}

function getClaimErrorMessage(
  message: string | undefined,
) {
  const text = message ?? ''

  if (text.includes('ALREADY_CLAIMED')) {
    return 'Ya reclamaste este premio.'
  }

  if (text.includes('NOT_A_WINNER')) {
    return 'Este premio es para quien ganó.'
  }

  if (text.includes('INVALID_TARGET')) {
    return 'Elegí a otra persona del grupo.'
  }

  if (text.includes('INVALID_CHOICE')) {
    return 'Elegí una opción de la lista.'
  }

  if (text.includes('NOT_CLAIMABLE')) {
    return 'Este premio no se reclama en la app.'
  }

  return 'No pudimos reclamar el premio.'
}

export async function claimTournamentPrize(
  tournamentId: string,
  options: {
    targetUserId?: string
    choice?: string
  } = {},
) {
  const { data, error } =
    await supabase.rpc(
      'claim_tournament_prize',
      {
        p_tournament_id: tournamentId,
        p_target_user_id:
          options.targetUserId ?? null,
        p_choice:
          options.choice ?? null,
      },
    )

  if (error) {
    console.error(
      'Error reclamando premio:',
      error,
    )

    return {
      ok: false as const,
      message: getClaimErrorMessage(
        error.message,
      ),
    }
  }

  const prizeType = (
    data as {
      prize_type?: string
    } | null
  )?.prize_type

  return {
    ok: true as const,
    prizeType: isPrizeType(prizeType)
      ? prizeType
      : null,
    fallback: Boolean(
      (
        data as {
          fallback_from?: string
        } | null
      )?.fallback_from,
    ),
  }
}
