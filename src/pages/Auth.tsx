import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'

import {
  supabase,
} from '../lib/supabase'

type AuthMode =
  | 'login'
  | 'register'
  | 'recovery'

function Auth() {
  /*
   * ========================================
   * MODO
   * ========================================
   */

  const [
    mode,
    setMode,
  ] =
    useState<AuthMode>(
      'login',
    )

  /*
   * ========================================
   * FORMULARIO
   * ========================================
   */

  const [
    name,
    setName,
  ] = useState('')

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    password,
    setPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

  /*
   * ========================================
   * ESTADOS
   * ========================================
   */

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    )

  const [
    recoverySent,
    setRecoverySent,
  ] = useState(false)

  /*
   * ========================================
   * CAMBIAR MODO
   * ========================================
   */

  const changeMode = (
    nextMode: AuthMode,
  ) => {
    setMode(nextMode)

    setError(null)
    setMessage(null)
    setRecoverySent(false)

    /*
     * No borramos el email
     * porque es cómodo conservarlo.
     */

    setPassword('')
  }

  /*
   * ========================================
   * TRADUCIR ALGUNOS ERRORES
   * ========================================
   */

  const getFriendlyError = (
    messageText: string,
  ) => {
    const normalized =
      messageText.toLowerCase()

    if (
      normalized.includes(
        'invalid login credentials',
      )
    ) {
      return 'Email o contraseña incorrectos.'
    }

    if (
      normalized.includes(
        'email not confirmed',
      )
    ) {
      return 'Primero tenés que confirmar tu email.'
    }

    if (
      normalized.includes(
        'user already registered',
      )
    ) {
      return 'Ya existe una cuenta con ese email.'
    }

    if (
      normalized.includes(
        'password should be at least',
      )
    ) {
      return 'La contraseña es demasiado corta.'
    }

    if (
      normalized.includes(
        'rate limit',
      )
    ) {
      return 'Se alcanzó temporalmente el límite de emails. Esperá un poco y volvé a intentar.'
    }

    if (
      normalized.includes(
        'email rate limit exceeded',
      )
    ) {
      return 'Se alcanzó temporalmente el límite de emails. Esperá un poco y volvé a intentar.'
    }

    return messageText
  }

  /*
   * ========================================
   * LOGIN
   * ========================================
   */

  const handleLogin =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase()

      if (
        !cleanEmail ||
        !password
      ) {
        setError(
          'Completá tu email y contraseña.',
        )

        return
      }

      setLoading(true)
      setError(null)
      setMessage(null)

      const {
        error:
          loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              cleanEmail,

            password,
          },
        )

      setLoading(false)

      if (loginError) {
        console.error(
          'Error login:',
          loginError,
        )

        setError(
          getFriendlyError(
            loginError.message,
          ),
        )

        return
      }

      /*
       * No necesitamos navegar
       * manualmente.
       *
       * App.tsx escucha el cambio
       * de sesión y abre RachaApp.
       */
    }

  /*
   * ========================================
   * REGISTRO
   * ========================================
   */

  const handleRegister =
    async () => {
      const cleanName =
        name.trim()

      const cleanEmail =
        email
          .trim()
          .toLowerCase()

      if (!cleanName) {
        setError(
          'Decime cómo te llamás 👀',
        )

        return
      }

      if (!cleanEmail) {
        setError(
          'Ingresá un email.',
        )

        return
      }

      if (
        password.length <
        8
      ) {
        setError(
          'La contraseña tiene que tener al menos 8 caracteres.',
        )

        return
      }

      setLoading(true)
      setError(null)
      setMessage(null)

      const {
        data,
        error:
          registerError,
      } =
        await supabase.auth.signUp(
          {
            email:
              cleanEmail,

            password,

            options: {
              data: {
                name:
                  cleanName,
              },
            },
          },
        )

      setLoading(false)

      if (
        registerError
      ) {
        console.error(
          'Error registro:',
          registerError,
        )

        setError(
          getFriendlyError(
            registerError.message,
          ),
        )

        return
      }

      /*
       * Si Confirm Email está
       * desactivado, Supabase puede
       * devolver sesión inmediatamente.
       *
       * En ese caso App.tsx entra solo.
       */

      if (data.session) {
        return
      }

      /*
       * Si Confirm Email está activo,
       * mostramos aviso.
       */

      setMessage(
        'Cuenta creada 🔥 Revisá tu correo para confirmar el email y después iniciá sesión.',
      )

      setPassword('')
    }

  /*
   * ========================================
   * RECUPERAR CONTRASEÑA
   * ========================================
   */

  const handlePasswordRecovery =
    async () => {
      const cleanEmail =
        email
          .trim()
          .toLowerCase()

      if (!cleanEmail) {
        setError(
          'Ingresá el email de tu cuenta.',
        )

        return
      }

      setLoading(true)
      setError(null)
      setMessage(null)
      setRecoverySent(false)

      const {
        error:
          recoveryError,
      } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/`,
          },
        )

      setLoading(false)

      if (
        recoveryError
      ) {
        console.error(
          'Error recuperación:',
          recoveryError,
        )

        setError(
          getFriendlyError(
            recoveryError.message,
          ),
        )

        return
      }

      setRecoverySent(
        true,
      )
    }

  /*
   * ========================================
   * SUBMIT
   * ========================================
   */

  const handleSubmit =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault()

      if (
        loading
      ) {
        return
      }

      if (
        mode ===
        'login'
      ) {
        await handleLogin()

        return
      }

      if (
        mode ===
        'register'
      ) {
        await handleRegister()

        return
      }

      await handlePasswordRecovery()
    }

  /*
   * ========================================
   * PANTALLA:
   * EMAIL DE RECUPERACIÓN ENVIADO
   * ========================================
   */

  if (
    mode ===
      'recovery' &&
    recoverySent
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 py-10">
        <div className="w-full max-w-md">
          <section className="rounded-[32px] bg-white p-7 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-green-100 text-green-600">
              <CheckCircle2
                size={34}
              />
            </div>

            <h1 className="mt-5 text-2xl font-black text-zinc-800">
              Revisá tu correo
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Te enviamos un enlace a
            </p>

            <p className="mt-1 break-all font-black text-zinc-700">
              {email}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              Entrá desde ese enlace
              y Racha te va a mostrar
              una pantalla para elegir
              una contraseña nueva.
            </p>

            <button
              type="button"
              onClick={() =>
                changeMode(
                  'login',
                )
              }
              className="mt-6 w-full rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
            >
              Volver al login
            </button>

            <button
              type="button"
              onClick={() => {
                setRecoverySent(
                  false,
                )
              }}
              className="mt-3 text-sm font-bold text-zinc-400"
            >
              Enviar otro enlace
            </button>
          </section>
        </div>
      </main>
    )
  }

  /*
   * ========================================
   * APP AUTH
   * ========================================
   */

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 py-10">
      <div className="w-full max-w-md">
        {/* ================================= */}
        {/* LOGO */}
        {/* ================================= */}

        <header className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-100">
            <Flame
              size={34}
              className="fill-orange-400 text-orange-400"
            />
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-800">
            Racha
          </h1>

          <p className="mt-2 text-zinc-500">
            Un día más cuenta. 🔥
          </p>
        </header>

        {/* ================================= */}
        {/* CARD */}
        {/* ================================= */}

        <section className="rounded-[32px] bg-white p-6 shadow-sm">
          {/* ================================= */}
          {/* RECUPERAR */}
          {/* ================================= */}

          {mode ===
            'recovery' ? (
            <>
              <button
                type="button"
                onClick={() =>
                  changeMode(
                    'login',
                  )
                }
                className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-violet-500"
              >
                <ArrowLeft
                  size={17}
                />

                Volver
              </button>

              <p className="text-sm font-bold text-violet-500">
                Recuperar acceso
              </p>

              <h2 className="mt-1 text-2xl font-black text-zinc-800">
                ¿Olvidaste tu contraseña?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Ingresá el email de tu
                cuenta y te mandamos un
                enlace para elegir una
                contraseña nueva.
              </p>
            </>
          ) : (
            <>
              {/* ================================= */}
              {/* LOGIN / REGISTRO TABS */}
              {/* ================================= */}

              <div className="mb-6 grid grid-cols-2 rounded-2xl bg-zinc-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      'login',
                    )
                  }
                  className={`rounded-xl py-3 text-sm font-black transition ${
                    mode ===
                    'login'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-zinc-400'
                  }`}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      'register',
                    )
                  }
                  className={`rounded-xl py-3 text-sm font-black transition ${
                    mode ===
                    'register'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-zinc-400'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>

              <h2 className="text-2xl font-black text-zinc-800">
                {mode ===
                'login'
                  ? 'Bienvenido de nuevo 👋'
                  : 'Sumate a Racha 🔥'}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {mode ===
                'login'
                  ? 'Entrá y fijate quién ya se movió hoy.'
                  : 'Creá tu cuenta y empezá una racha con tus amigos.'}
              </p>
            </>
          )}

          {/* ================================= */}
          {/* FORM */}
          {/* ================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-6"
          >
            {/* ================================= */}
            {/* NOMBRE */}
            {/* ================================= */}

            {mode ===
              'register' && (
              <div className="mb-5">
                <label className="text-xs font-black tracking-wider text-zinc-400">
                  NOMBRE
                </label>

                <div className="mt-2 flex items-center rounded-2xl bg-zinc-50 px-4">
                  <UserRound
                    size={19}
                    className="shrink-0 text-zinc-400"
                  />

                  <input
                    type="text"
                    value={
                      name
                    }
                    onChange={(
                      event,
                    ) =>
                      setName(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Tu nombre"
                    autoComplete="name"
                    maxLength={40}
                    disabled={
                      loading
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-4 font-medium text-zinc-800 outline-none placeholder:text-zinc-300 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {/* ================================= */}
            {/* EMAIL */}
            {/* ================================= */}

            <div className="mb-5">
              <label className="text-xs font-black tracking-wider text-zinc-400">
                EMAIL
              </label>

              <div className="mt-2 flex items-center rounded-2xl bg-zinc-50 px-4">
                <Mail
                  size={19}
                  className="shrink-0 text-zinc-400"
                />

                <input
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="vos@email.com"
                  autoComplete="email"
                  disabled={
                    loading
                  }
                  className="min-w-0 flex-1 bg-transparent px-3 py-4 font-medium text-zinc-800 outline-none placeholder:text-zinc-300 disabled:opacity-60"
                />
              </div>
            </div>

            {/* ================================= */}
            {/* CONTRASEÑA */}
            {/* ================================= */}

            {mode !==
              'recovery' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black tracking-wider text-zinc-400">
                    CONTRASEÑA
                  </label>

                  {mode ===
                    'login' && (
                    <button
                      type="button"
                      onClick={() =>
                        changeMode(
                          'recovery',
                        )
                      }
                      className="text-xs font-black text-violet-500"
                    >
                      ¿La olvidaste?
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center rounded-2xl bg-zinc-50 px-4">
                  <LockKeyhole
                    size={19}
                    className="shrink-0 text-zinc-400"
                  />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder={
                      mode ===
                      'register'
                        ? 'Mínimo 8 caracteres'
                        : 'Tu contraseña'
                    }
                    autoComplete={
                      mode ===
                      'register'
                        ? 'new-password'
                        : 'current-password'
                    }
                    disabled={
                      loading
                    }
                    className="min-w-0 flex-1 bg-transparent px-3 py-4 font-medium text-zinc-800 outline-none placeholder:text-zinc-300 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    className="shrink-0 text-zinc-400"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={19}
                      />
                    ) : (
                      <Eye
                        size={19}
                      />
                    )}
                  </button>
                </div>

                {mode ===
                  'register' && (
                  <p className="mt-2 text-xs font-medium text-zinc-400">
                    Usá al menos 8 caracteres.
                  </p>
                )}
              </div>
            )}

            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-relaxed text-red-500">
                {error}
              </div>
            )}

            {/* ================================= */}
            {/* MENSAJE */}
            {/* ================================= */}

            {message && (
              <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold leading-relaxed text-green-600">
                {message}
              </div>
            )}

            {/* ================================= */}
            {/* SUBMIT */}
            {/* ================================= */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />

                  {mode ===
                  'login'
                    ? 'Entrando...'
                    : mode ===
                        'register'
                      ? 'Creando cuenta...'
                      : 'Enviando...'}
                </>
              ) : mode ===
                'login' ? (
                'Entrar a Racha 🔥'
              ) : mode ===
                'register' ? (
                'Crear mi cuenta 🔥'
              ) : (
                'Enviarme el enlace'
              )}
            </button>
          </form>

          {/* ================================= */}
          {/* PIE RECOVERY */}
          {/* ================================= */}

          {mode ===
            'recovery' && (
            <p className="mt-5 text-center text-xs leading-relaxed text-zinc-400">
              El enlace te va a llevar
              nuevamente a Racha para
              elegir tu nueva contraseña.
            </p>
          )}
        </section>

        {/* ================================= */}
        {/* FOOTER */}
        {/* ================================= */}

        <p className="mt-6 text-center text-xs font-semibold text-zinc-300">
          🔥 Racha · Un día más cuenta.
        </p>
      </div>
    </main>
  )
}

export default Auth