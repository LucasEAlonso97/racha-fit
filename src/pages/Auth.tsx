import { useState } from 'react'
import {
  Flame,
  LoaderCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

type Mode =
  | 'login'
  | 'register'

function Auth() {
  const [
    mode,
    setMode,
  ] =
    useState<Mode>('login')

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
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null)

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null)

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (
        mode === 'register'
      ) {
        if (!name.trim()) {
          setError(
            'Poné tu nombre.',
          )

          return
        }

        const {
          data,
          error:
            signUpError,
        } =
          await supabase.auth.signUp(
            {
              email,
              password,

              options: {
                data: {
                  name: name.trim(),
                },
              },
            },
          )

        if (signUpError) {
          setError(
            signUpError.message,
          )

          return
        }

        if (!data.session) {
          setMessage(
            'Cuenta creada 🔥 Revisá tu email para confirmarla.',
          )
        } else {
          setMessage(
            'Cuenta creada. Bienvenido a Racha 🔥',
          )
        }

        return
      }

      const {
        error:
          signInError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          },
        )

      if (signInError) {
        setError(
          'Email o contraseña incorrectos.',
        )
      }
    } catch {
      setError(
        'Algo salió mal. Probá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  const changeMode = (
    newMode: Mode,
  ) => {
    setMode(newMode)
    setError(null)
    setMessage(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[28px] bg-violet-500 shadow-xl shadow-violet-200">
            <Flame
              size={42}
              className="fill-orange-300 text-orange-300"
            />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-zinc-800">
            Racha
          </h1>

          <p className="mt-2 font-medium text-zinc-500">
            Un día más cuenta.
          </p>
        </div>

        <section className="rounded-[32px] bg-white p-6 shadow-sm">
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

          <div className="mb-6">
            <p className="text-sm font-bold text-violet-500">
              {mode ===
              'login'
                ? 'Hola de nuevo 👋'
                : 'Bienvenido 🔥'}
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-800">
              {mode ===
              'login'
                ? 'Seguí con tu racha'
                : 'Creá tu cuenta'}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {mode ===
              'login'
                ? 'Tu grupo te está esperando.'
                : 'Después vas a poder crear o unirte a un grupo.'}
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-4"
          >
            {mode ===
              'register' && (
              <div>
                <label className="mb-2 block text-sm font-bold text-zinc-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Lucas"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Email
              </label>

              <input
                type="email"
                value={email}
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
                required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-zinc-700">
                Contraseña
              </label>

              <input
                type="password"
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
                placeholder="••••••••"
                autoComplete={
                  mode ===
                  'login'
                    ? 'current-password'
                    : 'new-password'
                }
                minLength={6}
                required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />
              )}

              {mode ===
              'login'
                ? 'Entrar a Racha 🔥'
                : 'Crear mi cuenta'}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-xs font-medium text-zinc-400">
          🐰 🧽 🔥
        </p>
      </div>
    </main>
  )
}

export default Auth