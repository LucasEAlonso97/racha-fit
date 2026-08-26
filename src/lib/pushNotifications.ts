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

/*
 * ========================================
 * SOPORTE
 * ========================================
 */

export function supportsPushNotifications() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/*
 * ========================================
 * COMPARAR CLAVE VAPID
 * ========================================
 *
 * Si regeneramos VAPID keys,
 * una suscripción anterior ya no nos sirve.
 */

function arrayBuffersEqual(
  first: ArrayBuffer | null,
  second: Uint8Array,
) {
  if (!first) {
    return false
  }

  const firstArray =
    new Uint8Array(first)

  if (
    firstArray.length !==
    second.length
  ) {
    return false
  }

  return firstArray.every(
    (value, index) =>
      value ===
      second[index],
  )
}

/*
 * ========================================
 * ¿ESTÁ ACTIVO EN ESTE DISPOSITIVO?
 * ========================================
 */

export async function getCurrentDevicePushStatus(
  userId: string,
) {
  if (
    !supportsPushNotifications()
  ) {
    return false
  }

  if (
    Notification.permission !==
    'granted'
  ) {
    return false
  }

  const registration =
    await navigator.serviceWorker.ready

  const subscription =
    await registration.pushManager
      .getSubscription()

  if (!subscription) {
    return false
  }

  /*
   * No alcanza con que exista localmente.
   *
   * También verificamos que ESA suscripción
   * esté guardada en Supabase para
   * ESTE usuario.
   */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'push_subscriptions',
      )
      .select('id')
      .eq(
        'user_id',
        userId,
      )
      .eq(
        'endpoint',
        subscription.endpoint,
      )
      .maybeSingle()

  if (error) {
    console.error(
      'Error verificando suscripción push:',
      error,
    )

    return false
  }

  return Boolean(data)
}

/*
 * ========================================
 * ACTIVAR PUSH
 * ========================================
 */

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

  /*
   * El permiso tiene que pedirse
   * desde una acción del usuario.
   */

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

  const vapidPublicKey =
    import.meta.env
      .VITE_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    throw new Error(
      'Falta VITE_VAPID_PUBLIC_KEY.',
    )
  }

  const applicationServerKey =
    urlBase64ToUint8Array(
      vapidPublicKey,
    )

  let subscription =
    await registration.pushManager
      .getSubscription()

  /*
   * Si existe una suscripción anterior
   * creada con otra VAPID key,
   * la eliminamos.
   *
   * Esto nos viene perfecto porque
   * acabamos de regenerar las claves.
   */

  if (subscription) {
    const existingKey =
      subscription.options
        .applicationServerKey

    const sameVapidKey =
      arrayBuffersEqual(
        existingKey,
        applicationServerKey,
      )

    if (!sameVapidKey) {
      console.log(
        'La VAPID key cambió. Recreando suscripción push...',
      )

      await subscription.unsubscribe()

      subscription = null
    }
  }

  /*
   * Si este dispositivo todavía
   * no tiene suscripción, la creamos.
   */

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe(
        {
          userVisibleOnly: true,

          applicationServerKey,
        },
      )
  }

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

  /*
   * ========================================
   * GUARDAR ESTE DISPOSITIVO
   * ========================================
   */

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

  /*
   * ========================================
   * PREFERENCIAS DEL USUARIO
   * ========================================
   */

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