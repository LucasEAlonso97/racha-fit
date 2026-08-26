import {
  useEffect,
  useState,
} from 'react'

import type {
  Session,
} from '@supabase/supabase-js'

import {
  supabase,
} from './lib/supabase'

import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import RachaApp from './RachaApp'

function App() {
  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    passwordRecovery,
    setPasswordRecovery,
  ] =
    useState(false)

  useEffect(() => {
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          event,
          newSession,
        ) => {
        
          setSession(
            newSession,
          )

          /*
           * Supabase dispara INITIAL_SESSION
           * cuando termina de recuperar
           * la sesión guardada.
           *
           * No necesitamos llamar también
           * a getSession().
           */
          if (
            event ===
            'INITIAL_SESSION'
          ) {
            setLoading(
              false,
            )
          }

          /*
           * Login correcto.
           */
          if (
            event ===
            'SIGNED_IN'
          ) {
            setLoading(
              false,
            )
          }

          /*
           * Recuperación de contraseña.
           */
          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {
            setPasswordRecovery(
              true,
            )

            setLoading(
              false,
            )
          }

          /*
           * Logout.
           */
          if (
            event ===
            'SIGNED_OUT'
          ) {
            setPasswordRecovery(
              false,
            )

            setLoading(
              false,
            )
          }
        },
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /*
   * CARGANDO
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">
            🔥
          </div>

          <p className="mt-3 font-bold text-violet-500">
            Cargando Racha...
          </p>
        </div>
      </main>
    )
  }

  /*
   * RECUPERACIÓN
   */

  if (
    passwordRecovery
  ) {
    return (
      <ResetPassword
        onComplete={() =>
          setPasswordRecovery(
            false,
          )
        }
      />
    )
  }

  /*
   * SIN SESIÓN
   */

  if (!session) {
    return <Auth />
  }

  /*
   * APP
   */

  return (
    <RachaApp
      session={
        session
      }
    />
  )
}

export default App