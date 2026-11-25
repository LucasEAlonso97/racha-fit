import {
  useEffect,
  useRef,
  useState,
} from 'react'

/*
 * ========================================
 * TIRAR HACIA ABAJO PARA ACTUALIZAR
 * ========================================
 *
 * Funciona cuando la pantalla está arriba
 * de todo y no hay ninguna ventana abierta.
 * Devuelve cuánto se tiró (para dibujar el
 * indicador) y si está actualizando.
 */

export const PULL_TRIGGER = 70
const PULL_MAX = 110

/*
 * Resistencia: cuanto más tirás, menos
 * baja (como en las apps nativas).
 */
function resist(distance: number) {
  return Math.min(
    PULL_MAX,
    distance * 0.5,
  )
}

export function usePullToRefresh(
  enabled: boolean,
  onRefresh: () => Promise<unknown>,
) {
  const [pull, setPull] = useState(0)

  const [refreshing, setRefreshing] =
    useState(false)

  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let startY = 0
    let startX = 0
    let tracking = false
    let pulling = false
    let current = 0
    let busy = false

    const onStart = (event: TouchEvent) => {
      const target =
        event.target instanceof HTMLElement
          ? event.target
          : null

      if (
        busy ||
        event.touches.length !== 1 ||
        window.scrollY > 0 ||
        document.querySelector(
          '[aria-modal="true"]',
        ) ||
        target?.closest(
          'input, textarea, select, [data-no-swipe]',
        )
      ) {
        tracking = false

        return
      }

      startY = event.touches[0].clientY
      startX = event.touches[0].clientX
      tracking = true
      pulling = false
      current = 0
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking) {
        return
      }

      const dy =
        event.touches[0].clientY - startY
      const dx =
        event.touches[0].clientX - startX

      if (!pulling) {
        if (
          dy < 0 ||
          Math.abs(dx) > Math.abs(dy) ||
          window.scrollY > 0
        ) {
          if (
            Math.abs(dx) > 8 ||
            dy < -8
          ) {
            tracking = false
          }

          return
        }

        if (dy < 8) {
          return
        }

        pulling = true
      }

      current = resist(Math.max(0, dy - 8))

      if (event.cancelable) {
        event.preventDefault()
      }

      setPull(current)
    }

    const onEnd = async () => {
      if (!pulling) {
        tracking = false

        return
      }

      tracking = false
      pulling = false

      if (current < PULL_TRIGGER) {
        setPull(0)

        return
      }

      busy = true
      setRefreshing(true)
      setPull(PULL_TRIGGER)

      try {
        await onRefreshRef.current()
      } finally {
        busy = false
        setRefreshing(false)
        setPull(0)
      }
    }

    window.addEventListener(
      'touchstart',
      onStart,
      {
        passive: true,
      },
    )

    window.addEventListener(
      'touchmove',
      onMove,
      {
        passive: false,
      },
    )

    window.addEventListener(
      'touchend',
      onEnd,
    )

    window.addEventListener(
      'touchcancel',
      onEnd,
    )

    return () => {
      window.removeEventListener(
        'touchstart',
        onStart,
      )
      window.removeEventListener(
        'touchmove',
        onMove,
      )
      window.removeEventListener(
        'touchend',
        onEnd,
      )
      window.removeEventListener(
        'touchcancel',
        onEnd,
      )
    }
  }, [enabled])

  return {
    pull,
    refreshing,
  }
}
