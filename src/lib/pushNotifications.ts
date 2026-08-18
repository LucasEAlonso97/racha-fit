import {
  supabase,
} from './supabase'

function urlBase64ToUint8Array(
  base64String: string,
) {
  const padding =
    '='.repeat(
      (4 -
        (base64String.length %
          4)) %
        4,
    )

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const rawData =
    window.atob(base64)

  return Uint8Array.from(
    [...rawData].map(
      (character) =>
        character.charCodeAt(0),
    ),
  )
}

export function supportsPushNotifications() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function enablePushNotifications(
  userId: string,
) {
  if (
    !supportsPushNotifications()
  ) {
    throw new Error(
      'Este dispositivo no soporta notificaciones push.',
    )
  }

  const permission =
    await Notification.requestPermission()

  if (
    permission !== 'granted'
  ) {
    throw new Error(
      'No se otorgó permiso para enviar notificaciones.',
    )
  }

  const registration =
    await navigator.serviceWorker.ready

  const existingSubscription =
    await registration.pushManager.getSubscription()

  const vapidPublicKey =
    import.meta.env
      .VITE_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    throw new Error(
      'Falta VITE_VAPID_PUBLIC_KEY.',
    )
  }

  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,

      applicationServerKey:
        urlBase64ToUint8Array(
          vapidPublicKey,
        ),
    }))

  const subscriptionJson =
    subscription.toJSON()

  const p256dh =
    subscriptionJson.keys?.p256dh

  const auth =
    subscriptionJson.keys?.auth

  if (
    !p256dh ||
    !auth
  ) {
    throw new Error(
      'La suscripción push no devolvió las claves necesarias.',
    )
  }

  const timezone =
    Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone

  const {
    error:
      subscriptionError,
  } =
    await supabase
      .from(
        'push_subscriptions',
      )
      .upsert(
        {
          user_id:
            userId,

          endpoint:
            subscription.endpoint,

          p256dh,

          auth,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'endpoint',
        },
      )

  if (
    subscriptionError
  ) {
    throw subscriptionError
  }

  const {
    error:
      preferencesError,
  } =
    await supabase
      .from(
        'notification_preferences',
      )
      .upsert(
        {
          user_id:
            userId,

          enabled: true,

          timezone,

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'user_id',
        },
      )

  if (
    preferencesError
  ) {
    throw preferencesError
  }

  return true
}