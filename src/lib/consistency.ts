import {
  supabase,
} from './supabase'

/*
 * ========================================
 * COMODINES POR CONSTANCIA
 * ========================================
 *
 * Cada 4 semanas seguidas cumpliendo la
 * meta semanal se gana 1 comodín (hasta
 * 6). La cuenta la hace la base de datos
 * (claim_consistency_wildcards) cada vez
 * que se abre la app.
 */

export const CONSISTENCY_WEEKS = 4

export type ConsistencyResult = {
  granted: number
  run: number
  atCap: boolean
}

type Row = {
  granted: number
  current_run: number
  at_cap: boolean
}

/*
 * Devuelve null si la migración todavía no
 * se corrió (la función no existe): la app
 * sigue andando igual, sin esta parte.
 */
export async function claimConsistencyWildcards(): Promise<ConsistencyResult | null> {
  const { data, error } =
    await supabase.rpc(
      'claim_consistency_wildcards',
    )

  if (error) {
    if (
      error.code !== 'PGRST202' &&
      error.code !== '42883'
    ) {
      console.error(
        'Error revisando comodines por constancia:',
        error,
      )
    }

    return null
  }

  const row = (
    data as Row[] | null
  )?.[0]

  if (!row) {
    return null
  }

  return {
    granted: Number(row.granted ?? 0),
    run: Number(row.current_run ?? 0),
    atCap: Boolean(row.at_cap),
  }
}

/*
 * Semanas hechas hacia el próximo comodín
 * (0 a 3).
 */
export function weeksTowardNext(
  run: number,
) {
  return run % CONSISTENCY_WEEKS
}
