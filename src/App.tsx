import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react'

import {
  retryImport,
} from './lib/appVersion'

import type {
  Session,
} from '@supabase/supabase-js'

import {
  supabase,
} from './lib/supabase'

const Auth = lazy(() =>
  retryImport(() => import('./pages/Auth')),
)
const ResetPassword = lazy(() =>
  retryImport(() => import('./pages/ResetPassword')),
)
import RachaApp from './RachaApp'
import {
  LoadingScreen,
} from './components/StatusScreen'

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
      <LoadingScreen message="Cargando Racha..." />
    )
  }

  /*
   * RECUPERACIÓN
   */

  if (
    passwordRecovery
  ) {
    return (
      <Suspense fallback={null}>
        <ResetPassword
          onComplete={() =>
            setPasswordRecovery(
              false,
            )
          }
        />
      </Suspense>
    )
  }

  /*
   * SIN SESIÓN
   */

  if (!session) {
    return (
      <Suspense fallback={null}>
        <Auth />
      </Suspense>
    )
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