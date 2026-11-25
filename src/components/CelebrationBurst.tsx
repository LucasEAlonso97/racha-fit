import {
  useEffect,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'

import {
  clearBurst,
  getBurst,
  subscribeBurst,
} from '../lib/celebrate'

const PARTICLES = 18
const DURATION_MS = 1400

/*
 * Lluvia de emojis que salen desde abajo
 * al guardar la actividad del día.
 * Montado una sola vez, en main.tsx.
 */
function CelebrationBurst() {
  const burst = useSyncExternalStore(
    subscribeBurst,
    getBurst,
  )

  useEffect(() => {
    if (!burst) {
      return
    }

    const timer = window.setTimeout(
      clearBurst,
      DURATION_MS,
    )

    return () => {
      window.clearTimeout(timer)
    }
  }, [burst])

  /*
   * Posiciones al azar pero fijas para
   * cada festejo.
   */
  const particles = useMemo(
    () =>
      burst
        ? Array.from(
            {
              length: PARTICLES,
            },
            (_, index) => ({
              left: 5 + ((index * 53) % 90),
              delay: (index % 6) * 60,
              size: 22 + ((index * 7) % 18),
              drift: ((index % 5) - 2) * 18,
              rise: 45 + ((index * 13) % 35),
            }),
          )
        : [],
    [burst],
  )

  if (!burst) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[95] overflow-hidden motion-reduce:hidden"
    >
      {particles.map(
        (particle, index) => (
          <span
            key={`${burst.id}-${index}`}
            className="celebration-particle absolute bottom-0"
            style={
              {
                left: `${particle.left}%`,
                fontSize: `${particle.size}px`,
                animationDelay: `${particle.delay}ms`,
                '--drift': `${particle.drift}px`,
                '--rise': `-${particle.rise}vh`,
              } as CSSProperties
            }
          >
            {burst.emoji}
          </span>
        ),
      )}
    </div>
  )
}

export default CelebrationBurst
