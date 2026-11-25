/*
 * ========================================
 * RACHA · SERVICE WORKER
 * ========================================
 *
 * 1. Guarda la app en el celu para que abra
 *    aunque no haya señal.
 *    - Páginas: primero internet; sin señal,
 *      la última guardada.
 *    - Archivos de /assets/ (tienen un hash
 *      en el nombre, nunca cambian): primero
 *      lo guardado.
 *    - Supabase y otros sitios: no se tocan.
 *
 * 2. Notificaciones push (más abajo).
 *
 * Al compilar, vite.config.ts completa
 * BUILD_ID y PRECACHE con los archivos de
 * esa versión.
 */

const BUILD_ID = '__BUILD_ID__'
const PRECACHE = /*__PRECACHE__*/ []

const ASSETS_CACHE = 'racha-assets'
const PAGES_CACHE = 'racha-pages'

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const assets =
        await caches.open(ASSETS_CACHE)

      await Promise.all(
        PRECACHE.map(async (url) => {
          if (
            await assets.match(url, {
              ignoreVary: true,
            })
          ) {
            return
          }

          try {
            await assets.add(url)
          } catch {
            // Se guarda la próxima vez que se use.
          }
        }),
      )

      try {
        const pages =
          await caches.open(PAGES_CACHE)

        await pages.add('/')
      } catch {
        // Sin señal al instalar: no pasa nada.
      }

      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      /*
       * Borra archivos de versiones viejas.
       */
      if (PRECACHE.length > 0) {
        const keep = new Set(
          PRECACHE.map(
            (url) =>
              new URL(url, self.location.origin)
                .href,
          ),
        )

        const assets =
          await caches.open(ASSETS_CACHE)

        const requests = await assets.keys()

        await Promise.all(
          requests
            .filter(
              (request) =>
                !keep.has(request.url),
            )
            .map((request) =>
              assets.delete(request),
            ),
        )
      }

      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  /*
   * Abrir la app (cualquier ruta: es una
   * sola página).
   */
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)

          if (response.ok) {
            const pages =
              await caches.open(PAGES_CACHE)

            await pages.put(
              '/',
              response.clone(),
            )
          }

          return response
        } catch {
          const cached =
            await caches.match('/', {
              ignoreVary: true,
            })

          return (
            cached ??
            new Response(
              'Sin conexión',
              {
                status: 503,
                headers: {
                  'Content-Type':
                    'text/plain; charset=utf-8',
                },
              },
            )
          )
        }
      })(),
    )

    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const assets =
          await caches.open(ASSETS_CACHE)

        /*
         * ignoreVary: el servidor puede mandar
         * "Vary: Origin" y los scripts de la
         * app se piden con Origin; sin esto
         * no encontraría lo guardado.
         */
        const cached =
          await assets.match(request, {
            ignoreVary: true,
          })

        if (cached) {
          return cached
        }

        const response = await fetch(request)

        if (response.ok) {
          await assets.put(
            request,
            response.clone(),
          )
        }

        return response
      })(),
    )
  }
})

/*
 * ========================================
 * NOTIFICACIONES
 * ========================================
 */

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Racha 🔥',
    body: 'Un día más cuenta.',
    url: '/',
  }

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      }
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      payload.title,
      {
        body: payload.body,

        tag:
          payload.tag ??
          'racha-notification',

        data: {
          url:
            payload.url ??
            '/',
        },
      },
    ),
  )
})

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()

    const targetUrl =
      event.notification.data?.url ?? '/'

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(targetUrl)

              return client.focus()
            }
          }

          return clients.openWindow
            ? clients.openWindow(targetUrl)
            : undefined
        }),
    )
  },
)