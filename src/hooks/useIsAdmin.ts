import {
  useEffect,
  useState,
} from 'react'

import {
  isAppAdmin,
} from '../lib/admin'

/*
 * ¿Esta cuenta puede ver el panel de admin?
 * Se pregunta a la base (app_admins).
 */
export function useIsAdmin(
  userId: string,
) {
  const [isAdmin, setIsAdmin] =
    useState(false)

  useEffect(() => {
    let cancelled = false

    void isAppAdmin().then((result) => {
      if (!cancelled) {
        setIsAdmin(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  return isAdmin
}
