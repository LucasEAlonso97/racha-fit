import {
  supabase,
} from './supabase'

/*
 * ========================================
 * PREMIO POR INVITAR
 * ========================================
 *
 * Anota quién invitó al usuario actual.
 * La base (claim_referral) decide si
 * corresponde; si no, devuelve false sin
 * error. Si la función todavía no existe
 * (migración sin correr), no pasa nada.
 */

export async function claimReferral(
  inviterId: string,
  groupId: string,
) {
  const { data, error } =
    await supabase.rpc(
      'claim_referral',
      {
        p_inviter_id: inviterId,
        p_group_id: groupId,
      },
    )

  if (error) {
    console.warn(
      'No se pudo anotar la invitación:',
      error.message,
    )

    return false
  }

  return data === true
}
