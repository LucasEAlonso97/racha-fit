/*
 * ========================================
 * PANTALLAS DE ESTADO (CARGA / ERROR)
 * ========================================
 */

type LoadingScreenProps = {
  message: string
}

export function LoadingScreen({
  message,
}: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-4xl">
          🔥
        </div>

        <p className="mt-3 font-bold text-violet-500">
          {message}
        </p>
      </div>
    </main>
  )
}

type ErrorScreenProps = {
  title: string
  message: string
  actionLabel: string
  onAction: () => void
}

export function ErrorScreen({
  title,
  message,
  actionLabel,
  onAction,
}: ErrorScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm">
        <div className="text-4xl">
          😵
        </div>

        <h1 className="mt-4 text-xl font-black text-zinc-800">
          {title}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white"
        >
          {actionLabel}
        </button>
      </div>
    </main>
  )
}
