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
    /*
     * Primero escuchamos eventos
     * de autenticación.
     */

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
           * El usuario llegó desde
           * el link del mail de
           * recuperación.
           */

          if (
            event ===
            'PASSWORD_RECOVERY'
          ) {
            setPasswordRecovery(
              true,
            )
          }

          /*
           * Si salió de la cuenta,
           * limpiamos el modo recovery.
           */

          if (
            event ===
            'SIGNED_OUT'
          ) {
            setPasswordRecovery(
              false,
            )
          }
        },
      )

    /*
     * Recuperar sesión actual.
     */

    const loadSession =
      async () => {
        const {
          data: {
            session:
              currentSession,
          },
        } =
          await supabase.auth.getSession()

        setSession(
          currentSession,
        )

        setLoading(
          false,
        )
      }

    void loadSession()

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
   * RECUPERAR CONTRASEÑA
   *
   * Tiene prioridad sobre RachaApp
   * porque Supabase crea una sesión
   * temporal al entrar mediante
   * el link de recuperación.
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