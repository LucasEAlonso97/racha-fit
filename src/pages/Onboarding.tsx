import {
  ArrowRight,
  Dumbbell,
  Flame,
  Users,
} from 'lucide-react'

import {
  useState,
} from 'react'

type Props = {
  onComplete: () => Promise<void>
}

const slides = [
  {
    title: 'Sumá movimiento',
    description:
      'Gym, caminata, bici, correr... No importa qué hagas. Lo importante es sumar.',
    icon: Dumbbell,
    background:
      'from-violet-100 via-purple-50 to-pink-50',
    iconBackground:
      'bg-violet-500',
  },
  {
    title: 'Mantené tu racha',
    description:
      'Cada día que te movés cuenta. La idea no es hacerlo perfecto, sino seguir apareciendo.',
    icon: Flame,
    background:
      'from-orange-100 via-pink-50 to-violet-50',
    iconBackground:
      'bg-orange-400',
  },
  {
    title: 'Motivate con tu grupo',
    description:
      'Mirá quién ya se movió, reaccioná a sus actividades y mantengan la racha juntos.',
    icon: Users,
    background:
      'from-pink-100 via-violet-50 to-purple-100',
    iconBackground:
      'bg-pink-500',
  },
]

function Onboarding({
  onComplete,
}: Props) {
  const [
    currentSlide,
    setCurrentSlide,
  ] = useState(0)

  const [
    loading,
    setLoading,
  ] = useState(false)

  const slide =
    slides[currentSlide]

  const Icon =
    slide.icon

  const isLast =
    currentSlide ===
    slides.length - 1

  const next = async () => {
    if (!isLast) {
      setCurrentSlide(
        (current) =>
          current + 1,
      )

      return
    }

    setLoading(true)

    try {
      await onComplete()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${slide.background} px-6 py-10`}
    >
      <div className="w-full max-w-md">
        {/* LOGO */}

        <div className="mb-10 flex items-center justify-center">
          <img
            src="/racha-192.png"
            alt="Racha"
            className="h-14 w-14 rounded-[20px] object-cover shadow-sm"
          />
        </div>

        {/* CONTENIDO */}

        <section className="text-center">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] ${slide.iconBackground} text-white shadow-lg`}
          >
            <Icon
              size={45}
              strokeWidth={2.2}
            />
          </div>

          <p className="mt-8 text-xs font-black tracking-[0.18em] text-violet-500">
            {currentSlide + 1} DE{' '}
            {slides.length}
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-800">
            {slide.title}
          </h1>

          <p className="mx-auto mt-4 max-w-xs text-base font-medium leading-relaxed text-zinc-500">
            {slide.description}
          </p>
        </section>

        {/* INDICADORES */}

        <div className="mt-10 flex justify-center gap-2">
          {slides.map(
            (_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index ===
                  currentSlide
                    ? 'w-8 bg-violet-500'
                    : 'w-2 bg-violet-200'
                }`}
              />
            ),
          )}
        </div>

        {/* BOTÓN */}

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void next()
          }
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 py-4 font-black text-white shadow-lg shadow-violet-200 transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading
            ? 'Preparando Racha...'
            : isLast
              ? 'Empezar mi Racha'
              : 'Siguiente'}

          {!loading && (
            <ArrowRight
              size={20}
            />
          )}
        </button>

        {/* VOLVER */}

        {currentSlide > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setCurrentSlide(
                (current) =>
                  current - 1,
              )
            }
            className="mt-4 w-full text-sm font-bold text-zinc-400"
          >
            Volver
          </button>
        )}
      </div>
    </main>
  )
}

export default Onboarding