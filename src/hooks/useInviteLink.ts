import {
  useState,
} from 'react'

/*
 * ========================================
 * INVITACIÓN POR LINK (?join=CODIGO)
 * ========================================
 */

function readInviteCodeFromUrl() {
  const code = new URLSearchParams(
    window.location.search,
  )
    .get('join')
    ?.trim()
    .toUpperCase()

  return code || null
}

export function useInviteLink() {
  const [code, setCode] =
    useState<string | null>(
      readInviteCodeFromUrl,
    )

  /*
   * Saca ?join= de la URL sin recargar.
   */
  const clear = () => {
    const url = new URL(
      window.location.href,
    )

    url.searchParams.delete('join')

    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    )

    setCode(null)
  }

  return {
    code,
    clear,
  }
}
