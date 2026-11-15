import {
  supabase,
} from './supabase'

/*
 * ========================================
 * CARGA DE CUENTA (PERFIL + GRUPOS)
 * ========================================
 */

const RETRY_DELAYS = [
  1500,
  3000,
]

const sleep = (
  milliseconds: number,
) =>
  new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds,
      )
    },
  )

function isJwtIssuedAtFuture(
  error:
    | {
        code?: string
        message?: string
      }
    | null
    | undefined,
) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST303' ||
    error.message
      ?.toLowerCase()
      .includes(
        'jwt issued at future',
      ) === true
  )
}

function fetchAccount(
  userId: string,
) {
  return Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, name, avatar_url, onboarding_completed',
      )
      .eq('id', userId)
      .single(),

    supabase
      .from('groups')
      .select(
        'id, name, invite_code, created_by',
      )
      .order('created_at', {
        ascending: true,
      }),
  ])
}

/*
 * Justo después del login, Supabase a veces
 * rechaza el JWT por "issued at future"
 * (diferencia de reloj). Reintentamos un par
 * de veces antes de rendirnos.
 */
export async function loadAccountWithRetry(
  userId: string,
) {
  let [
    profileResult,
    groupsResult,
  ] =
    await fetchAccount(userId)

  for (const delay of RETRY_DELAYS) {
    const hasJwtError =
      isJwtIssuedAtFuture(
        profileResult.error,
      ) ||
      isJwtIssuedAtFuture(
        groupsResult.error,
      )

    if (!hasJwtError) {
      break
    }

    console.warn(
      `Supabase JWT todavía no válido. Reintentando en ${delay}ms...`,
    )

    await sleep(delay)

    ;[
      profileResult,
      groupsResult,
    ] =
      await fetchAccount(userId)
  }

  return {
    profileResult,
    groupsResult,
  }
}
