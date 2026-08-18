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