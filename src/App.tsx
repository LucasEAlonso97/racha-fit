import {
  lazy,
  Suspense,
  useEffect,
  useRef,
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

/*
 * Sesión que Supabase guarda en el celu
 * (clave sb-<proyecto>-auth-token).
 */
function readStoredSession(): Session | null {
  try {
    const key = Object.keys(
      window.localStorage,
    ).find((name) =>
      /^sb-.+-auth-token$/.test(name),
    )

    if (!key) {
      return null
    }

    const stored = JSON.parse(
      window.localStorage.getItem(key) ??
        'null',
    ) as Session | null

    return stored?.user?.id
      ? stored
      : null
  } catch {
    return null
  }
}

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

  /*
   * true hasta que se sabe si hay sesión.
   */
  const loadingRef = useRef(true)

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
        
          /*
           * Sin señal y con el token vencido,
           * Supabase no puede renovarlo y
           * devuelve null: usamos la sesión
           * guardada en el celu hasta que
           * vuelva internet.
           */
          /*
           * Si Supabase no pudo renovar la
           * sesión por falta de señal, la deja
           * guardada (si la sesión ya no sirve,
           * la borra). Mientras siga guardada,
           * seguimos adentro.
           */
          setSession(
            newSession ??
              (event ===
              'INITIAL_SESSION'
                ? readStoredSession()
                : null),
          )

          loadingRef.current = false

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

    /*
     * Sin señal (o con señal muy débil),
     * Supabase tarda hasta 30 segundos en
     * darse por vencido. Si hay una sesión
     * guardada, entramos con eso: sin señal
     * al toque, con señal débil a los 4 s.
     */
    const stored = readStoredSession()

    let fallbackTimer: number | undefined

    if (stored) {
      const enterWithStored = () => {
        if (!loadingRef.current) {
          return
        }

        loadingRef.current = false
        setSession(stored)
        setLoading(false)
      }

      if (!navigator.onLine) {
        enterWithStored()
      } else {
        fallbackTimer = window.setTimeout(
          enterWithStored,
          4000,
        )
      }
    }

    /*
     * Volvió internet: se renueva la sesión.
     */
    const onOnline = () => {
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data.session) {
            setSession(data.session)
          } else if (navigator.onLine) {
            setSession(null)
          }
        })
    }

    window.addEventListener(
      'online',
      onOnline,
    )

    return () => {
      subscription.unsubscribe()

      window.clearTimeout(fallbackTimer)

      window.removeEventListener(
        'online',
        onOnline,
      )
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