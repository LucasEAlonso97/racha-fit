import {
  useState,
} from 'react'

import {
  clearPendingInvite,
  readPendingInvite,
} from '../lib/pendingInvite'

/*
 * ========================================
 * INVITACIÓN POR LINK
 * ========================================
 *
 * ?join=CODIGO&ref=ID_DE_QUIEN_INVITA
 *
 * Se guarda también en el navegador (ver
 * lib/pendingInvite.ts), así no se pierde
 * si el invitado se registra y confirma
 * el mail antes de entrar.
 */

export function useInviteLink() {
  const [invite, setInvite] = useState(
    readPendingInvite,
  )

  const clear = () => {
    clearPendingInvite()
    setInvite(null)
  }

  return {
    code: invite?.code ?? null,
    ref: invite?.ref ?? null,
    clear,
  }
}
