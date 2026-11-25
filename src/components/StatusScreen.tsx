/*
 * ========================================
 * PANTALLAS DE ESTADO (CARGA / ERROR)
 * ========================================
 */

type LoadingScreenProps = {
  message: string
}

function Bone({
  className,
}: {
  className: string
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-zinc-200/70 ${className}`}
    />
  )
}

/*
 * Mientras carga se muestra la forma de la
 * pantalla en gris, en vez de un cartel:
 * se siente más rápido.
 */
export function LoadingScreen({
  message,
}: LoadingScreenProps) {
  return (
    <main
      role="status"
      aria-busy="true"
      className="min-h-screen pb-28"
    >
      <span className="sr-only">
        {message}
      </span>

      {/* Barra del grupo */}
      <div className="mx-auto w-full max-w-md px-5 pt-4">
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <Bone className="h-5 w-36 rounded-full" />
          <Bone className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-5 pt-8">
        {/* Saludo */}
        <div className="mb-7 flex items-center justify-between">
          <div className="space-y-2">
            <Bone className="h-4 w-32 rounded-full" />
            <Bone className="h-8 w-52 rounded-full" />
          </div>

          <Bone className="h-14 w-14 rounded-full" />
        </div>

        {/* Racha del grupo */}
        <Bone className="mb-5 h-44 w-full rounded-[28px]" />

        <PageSkeleton />
      </div>
    </main>
  )
}

/*
 * Para pantallas que se están bajando
 * (Calendario, Perfil...).
 */
export function PageSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="space-y-4"
    >
      <Bone className="h-6 w-40 rounded-full" />

      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-sm"
        >
          <Bone className="h-11 w-11 shrink-0 rounded-full" />

          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-1/2 rounded-full" />
            <Bone className="h-3 w-3/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
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
