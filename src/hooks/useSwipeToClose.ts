import {
  useEffect,
  useRef,
  useState,
} from 'react'

/*
 * ========================================
 * CERRAR DESLIZANDO HACIA ABAJO
 * ========================================
 *
 * Para las ventanas que suben desde abajo:
 *
 *   const sheetRef = useSwipeToClose(onClose)
 *   <div ref={sheetRef}>...</div>
 *
 * - Solo arranca si el contenido está
 *   scrolleado arriba de todo (si no, el
 *   dedo scrollea normal).
 * - No se activa arrastrando sobre campos
 *   de texto ni en gestos de costado.
 * - Si se suelta antes de bajarla lo
 *   suficiente, vuelve a su lugar.
 */

const START_THRESHOLD = 8
const CLOSE_DISTANCE = 120
const CLOSE_VELOCITY = 0.6

function isFormField(
  target: EventTarget | null,
) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        'input, textarea, select, [data-no-swipe]',
      ),
    )
  )
}

function isScrolledInside(
  target: EventTarget | null,
  sheet: HTMLElement,
) {
  let element =
    target instanceof HTMLElement
      ? target
      : null

  while (element) {
    if (element.scrollTop > 0) {
      return true
    }

    if (element === sheet) {
      return false
    }

    element = element.parentElement
  }

  return false
}

export function useSwipeToClose<
  T extends HTMLElement = HTMLElement,
>(onClose: () => void) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const [sheet, setSheet] =
    useState<T | null>(null)

  useEffect(() => {
    if (!sheet) {
      return
    }

    let startX = 0
    let startY = 0
    let startTime = 0
    let offset = 0
    let tracking = false
    let dragging = false

    const reset = (animate: boolean) => {
      sheet.style.transition = animate
        ? 'transform 0.22s ease-out'
        : ''
      sheet.style.transform = ''
    }

    const onStart = (event: TouchEvent) => {
      if (
        event.touches.length !== 1 ||
        isFormField(event.target) ||
        isScrolledInside(
          event.target,
          sheet,
        )
      ) {
        tracking = false

        return
      }

      const touch = event.touches[0]

      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
      offset = 0
      tracking = true
      dragging = false
    }

    const onMove = (event: TouchEvent) => {
      if (!tracking) {
        return
      }

      const touch = event.touches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY

      if (!dragging) {
        /*
         * Gesto de costado o hacia arriba:
         * no es para cerrar.
         */
        if (
          Math.abs(dx) > Math.abs(dy) ||
          dy < 0
        ) {
          if (
            Math.abs(dx) >
              START_THRESHOLD ||
            dy < -START_THRESHOLD
          ) {
            tracking = false
          }

          return
        }

        if (dy < START_THRESHOLD) {
          return
        }

        dragging = true
        sheet.style.transition = 'none'
      }

      offset = Math.max(
        0,
        dy - START_THRESHOLD,
      )

      if (event.cancelable) {
        event.preventDefault()
      }

      sheet.style.transform = `translateY(${offset}px)`
    }

    const onEnd = () => {
      if (!dragging) {
        tracking = false

        return
      }

      const velocity =
        offset /
        Math.max(
          1,
          Date.now() - startTime,
        )

      tracking = false
      dragging = false

      if (
        offset > CLOSE_DISTANCE ||
        velocity > CLOSE_VELOCITY
      ) {
        sheet.style.transition =
          'transform 0.2s ease-in'
        sheet.style.transform =
          'translateY(110%)'

        window.setTimeout(() => {
          onCloseRef.current()

          /*
           * Si la ventana no se cerró (por
           * ejemplo, pidió confirmación),
           * vuelve a su lugar.
           */
          window.setTimeout(() => {
            if (sheet.isConnected) {
              reset(true)
            }
          }, 250)
        }, 180)

        return
      }

      reset(true)
    }

    sheet.addEventListener(
      'touchstart',
      onStart,
      {
        passive: true,
      },
    )

    sheet.addEventListener(
      'touchmove',
      onMove,
      {
        passive: false,
      },
    )

    sheet.addEventListener(
      'touchend',
      onEnd,
    )

    sheet.addEventListener(
      'touchcancel',
      onEnd,
    )

    return () => {
      sheet.removeEventListener(
        'touchstart',
        onStart,
      )
      sheet.removeEventListener(
        'touchmove',
        onMove,
      )
      sheet.removeEventListener(
        'touchend',
        onEnd,
      )
      sheet.removeEventListener(
        'touchcancel',
        onEnd,
      )
    }
  }, [sheet])

  return setSheet
}
