import {
  useState,
} from 'react'

import {
  Eye,
  EyeOff,
  Flame,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react'

import {
  supabase,
} from '../lib/supabase'

type Props = {
  onComplete: () => void
}

function ResetPassword({
  onComplete,
}: Props) {
  const [
    password,
    setPassword,
  ] = useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    showPassword,
    setShowPassword,
  ] = useState(false)

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
    success,
    setSuccess,
  ] = useState(false)

  const handleSubmit =
    async (
      event:
        React.FormEvent,
    ) => {
      event.preventDefault()

      setError(null)

      if (
        password.length < 8
      ) {
        setError(
          'La contraseña tiene que tener al menos 8 caracteres.',
        )

        return
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          'Las contraseñas no coinciden.',
        )

        return
      }

      setLoading(true)

      const {
        error:
          updateError,
      } =
        await supabase.auth.updateUser(
          {
            password,
          },
        )

      setLoading(false)

      if (updateError) {
        console.error(
          'Error actualizando contraseña:',
          updateError,
        )

        setError(
          'No pudimos cambiar tu contraseña. Probá solicitar otro enlace.',
        )

        return
      }

      setSuccess(true)
    }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5">
        <div className="w-full max-w-md rounded-[32px] bg-white p-7 text-center shadow-sm">
          <div className="text-5xl">
            🔥
          </div>

          <h1 className="mt-5 text-2xl font-black text-zinc-800">
            Contraseña actualizada
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Ya podés seguir usando
            Racha con tu nueva
            contraseña.
          </p>

          <button
            onClick={
              onComplete
            }
            className="mt-6 w-full rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98]"
          >
            Entrar a Racha 🔥
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-violet-100">
            <Flame
              size={32}
              className="fill-orange-400 text-orange-400"
            />
          </div>

          <h1 className="mt-5 text-3xl font-black text-zinc-800">
            Nueva contraseña
          </h1>

          <p className="mt-2 text-zinc-500">
            Elegí una nueva contraseña
            para tu cuenta.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-[30px] bg-white p-6 shadow-sm"
        >
          <label className="text-xs font-black tracking-wider text-zinc-400">
            NUEVA CONTRASEÑA
          </label>

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
                  event.target
                    .value,
                )
              }
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none"
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
              className="text-zinc-400"
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

          <label className="mt-5 block text-xs font-black tracking-wider text-zinc-400">
            REPETIR CONTRASEÑA
          </label>

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
                confirmPassword
              }
              onChange={(
                event,
              ) =>
                setConfirmPassword(
                  event.target
                    .value,
                )
              }
              placeholder="Repetí tu contraseña"
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                />

                Guardando...
              </>
            ) : (
              'Guardar contraseña 🔥'
            )}
          </button>
        </form>
      </div>
    </main>
  )
}

export default ResetPassword