import {
  supabase,
} from './supabase'

/*
 * ========================================
 * FOTOS DE ACTIVIDADES
 * ========================================
 *
 * Bucket público "activity-photos".
 * Ruta: {groupId}/{userId}/{uuid}.jpg
 * (las políticas de Storage dependen de
 * este orden de carpetas).
 */

const BUCKET = 'activity-photos'

const MAX_SIDE_PX = 1280
const JPEG_QUALITY = 0.8

/*
 * Achica la foto antes de subirla: las del
 * celu pesan 3-8 MB y para verla en la app
 * alcanza con ~200 KB.
 */
async function compressImage(
  file: File,
): Promise<Blob> {
  const bitmap =
    await createImageBitmap(file)

  const scale = Math.min(
    1,
    MAX_SIDE_PX /
      Math.max(
        bitmap.width,
        bitmap.height,
      ),
  )

  const canvas =
    document.createElement('canvas')

  canvas.width = Math.round(
    bitmap.width * scale,
  )

  canvas.height = Math.round(
    bitmap.height * scale,
  )

  const context =
    canvas.getContext('2d')

  if (!context) {
    bitmap.close()

    return file
  }

  context.drawImage(
    bitmap,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  bitmap.close()

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export async function uploadActivityPhoto(
  file: File,
  groupId: string,
  userId: string,
) {
  let blob: Blob = file

  try {
    blob = await compressImage(file)
  } catch (error) {
    console.warn(
      'No se pudo comprimir la foto, se sube original:',
      error,
    )
  }

  const path =
    `${groupId}/${userId}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType:
        blob.type || 'image/jpeg',
      cacheControl: '31536000',
    })

  if (error) {
    console.error(
      'Error subiendo foto:',
      error,
    )

    return null
  }

  return supabase.storage
    .from(BUCKET)
    .getPublicUrl(path).data.publicUrl
}

/*
 * Borrado "best effort": si falla, queda
 * un archivo huérfano pero la app sigue.
 */
export async function deleteActivityPhoto(
  photoUrl: string | null | undefined,
) {
  if (!photoUrl) {
    return
  }

  const marker =
    `/object/public/${BUCKET}/`

  const index =
    photoUrl.indexOf(marker)

  if (index === -1) {
    return
  }

  const path = decodeURIComponent(
    photoUrl
      .slice(index + marker.length)
      .split('?')[0],
  )

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    console.warn(
      'No se pudo borrar la foto vieja:',
      error,
    )
  }
}
