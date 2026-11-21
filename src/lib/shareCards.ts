/*
 * ========================================
 * TARJETAS PARA COMPARTIR (HISTORIAS)
 * ========================================
 *
 * Se dibujan en un <canvas> en el mismo
 * celu (1080x1920, formato historia de
 * Instagram) y se comparten con el menú
 * nativo del teléfono. Si el navegador
 * no puede compartir archivos, se descarga.
 */

const WIDTH = 1080
const HEIGHT = 1920

const APP_URL = 'racha-fit.netlify.app'

const FONT =
  'Inter, system-ui, -apple-system, "Segoe UI", sans-serif'

export type SummaryCardData = {
  title: string
  subtitle: string
  stats: {
    value: string
    label: string
  }[]
}

export type MilestoneCardData = {
  days: number
  name: string
  groupName: string
}

let logoPromise: Promise<HTMLImageElement> | null =
  null

function loadLogo() {
  logoPromise ??= new Promise(
    (resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = '/racha-512.png'
    },
  )

  return logoPromise
}

function createCanvas() {
  const canvas =
    document.createElement('canvas')

  canvas.width = WIDTH
  canvas.height = HEIGHT

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error(
      'Canvas no disponible',
    )
  }

  return { canvas, context }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(
    x,
    y,
    width,
    height,
    radius,
  )
}

/*
 * Fondo violeta → fucsia → naranja
 * con dos brillos suaves.
 */
function drawBackground(
  context: CanvasRenderingContext2D,
) {
  const gradient =
    context.createLinearGradient(
      0,
      0,
      WIDTH,
      HEIGHT,
    )

  gradient.addColorStop(0, '#8b5cf6')
  gradient.addColorStop(0.55, '#c026d3')
  gradient.addColorStop(1, '#f97316')

  context.fillStyle = gradient
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle =
    'rgba(255, 255, 255, 0.10)'

  context.beginPath()
  context.arc(120, 220, 360, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.arc(
    WIDTH - 80,
    HEIGHT - 260,
    420,
    0,
    Math.PI * 2,
  )
  context.fill()
}

/*
 * Logo + "Racha" arriba, URL abajo.
 */
async function drawBranding(
  context: CanvasRenderingContext2D,
) {
  try {
    const logo = await loadLogo()

    context.save()
    roundedRect(
      context,
      90,
      120,
      150,
      150,
      36,
    )
    context.clip()
    context.drawImage(
      logo,
      90,
      120,
      150,
      150,
    )
    context.restore()
  } catch {
    // Sin logo, sigue igual.
  }

  context.fillStyle = '#ffffff'
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.font = `900 64px ${FONT}`
  context.fillText('Racha', 270, 195)

  context.textAlign = 'center'
  context.font = `700 40px ${FONT}`
  context.fillStyle =
    'rgba(255, 255, 255, 0.9)'
  context.fillText(
    `Un día más cuenta · ${APP_URL}`,
    WIDTH / 2,
    HEIGHT - 120,
  )
}

/*
 * Achica la letra hasta que el texto
 * entre en el ancho disponible.
 */
function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: number,
  startSize: number,
) {
  let size = startSize

  do {
    context.font = `${weight} ${size}px ${FONT}`
    size -= 4
  } while (
    context.measureText(text).width >
      maxWidth &&
    size > 24
  )
}

function toBlob(
  canvas: HTMLCanvasElement,
) {
  return new Promise<Blob>(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new Error(
                  'No se pudo generar la imagen',
                ),
              ),
        'image/png',
      )
    },
  )
}

/*
 * ========================================
 * RESUMEN DEL MES / AÑO
 * ========================================
 */

export async function drawSummaryCard(
  data: SummaryCardData,
) {
  const { canvas, context } =
    createCanvas()

  drawBackground(context)
  await drawBranding(context)

  context.fillStyle = '#ffffff'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  context.font = `700 52px ${FONT}`
  context.fillStyle =
    'rgba(255, 255, 255, 0.85)'
  context.fillText(
    data.subtitle,
    WIDTH / 2,
    520,
  )

  context.fillStyle = '#ffffff'
  fitText(
    context,
    data.title,
    WIDTH - 160,
    900,
    120,
  )
  context.fillText(
    data.title,
    WIDTH / 2,
    660,
  )

  /*
   * Grilla 2x2 de números.
   */
  const boxWidth = 420
  const boxHeight = 300
  const gap = 40
  const startX =
    (WIDTH - boxWidth * 2 - gap) / 2
  const startY = 790

  data.stats.slice(0, 4).forEach(
    (stat, index) => {
      const x =
        startX +
        (index % 2) * (boxWidth + gap)
      const y =
        startY +
        Math.floor(index / 2) *
          (boxHeight + gap)

      context.fillStyle =
        'rgba(255, 255, 255, 0.18)'
      roundedRect(
        context,
        x,
        y,
        boxWidth,
        boxHeight,
        48,
      )
      context.fill()

      context.fillStyle = '#ffffff'
      fitText(
        context,
        stat.value,
        boxWidth - 60,
        900,
        96,
      )
      context.fillText(
        stat.value,
        x + boxWidth / 2,
        y + 165,
      )

      context.font = `700 40px ${FONT}`
      context.fillStyle =
        'rgba(255, 255, 255, 0.85)'
      context.fillText(
        stat.label,
        x + boxWidth / 2,
        y + 235,
      )
    },
  )

  return toBlob(canvas)
}

/*
 * ========================================
 * HITO DE RACHA
 * ========================================
 */

export async function drawMilestoneCard(
  data: MilestoneCardData,
) {
  const { canvas, context } =
    createCanvas()

  drawBackground(context)
  await drawBranding(context)

  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'

  context.font = `400 260px ${FONT}`
  context.fillText(
    '🔥',
    WIDTH / 2,
    760,
  )

  context.fillStyle = '#ffffff'
  context.font = `900 360px ${FONT}`
  context.fillText(
    String(data.days),
    WIDTH / 2,
    1130,
  )

  context.font = `900 96px ${FONT}`
  context.fillText(
    data.days === 1
      ? 'día seguido'
      : 'días seguidos',
    WIDTH / 2,
    1260,
  )

  context.font = `700 52px ${FONT}`
  context.fillStyle =
    'rgba(255, 255, 255, 0.88)'

  fitText(
    context,
    `${data.name} · ${data.groupName}`,
    WIDTH - 160,
    700,
    52,
  )
  context.fillText(
    `${data.name} · ${data.groupName}`,
    WIDTH / 2,
    1380,
  )

  return toBlob(canvas)
}

/*
 * ========================================
 * COMPARTIR
 * ========================================
 *
 * Devuelve:
 *   'shared'     -> se abrió el menú de compartir
 *   'downloaded' -> no se puede compartir archivos, se bajó
 *   'cancelled'  -> el usuario cerró el menú
 */

export async function shareImage(
  blob: Blob,
  fileName: string,
  text: string,
) {
  const file = new File(
    [blob],
    fileName,
    {
      type: 'image/png',
    },
  )

  if (
    navigator.canShare?.({
      files: [file],
    })
  ) {
    try {
      await navigator.share({
        files: [file],
        text: `${text} https://${APP_URL}`,
      })

      return 'shared' as const
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return 'cancelled' as const
      }

      throw error
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  link.click()

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    5000,
  )

  return 'downloaded' as const
}
