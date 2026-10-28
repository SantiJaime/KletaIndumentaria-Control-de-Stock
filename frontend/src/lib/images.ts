import type { PixelCrop } from 'react-image-crop'

/** Formatos de foto aceptados (iguales que en el backend). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Tamaño máximo de la foto que se sube (igual que en el backend). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

/**
 * Tamaño máximo de la foto original antes de recortarla: el recorte la achica y comprime, así que se aceptan
 * fotos de celular más pesadas que el límite de subida.
 */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024

/** Lado máximo (px) del recorte que se sube; más grande no se aprovecha (el backend guarda hasta 1200 px). */
const MAX_OUTPUT_SIDE = 1600

/** Calidad JPEG del recorte (0 a 1). */
const JPEG_QUALITY = 0.9

/** Mensaje de error si la foto elegida no sirve para recortar, o `null` si está bien. */
export function validateSourceImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'La foto debe ser JPG, PNG o WEBP'
  if (file.size > MAX_SOURCE_BYTES) return 'La foto no puede superar los 25 MB'
  return null
}

/** Mensaje de error si la foto ya recortada no se puede subir, o `null` si está bien. */
export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'La foto debe ser JPG, PNG o WEBP'
  if (file.size > MAX_IMAGE_BYTES) return 'La foto no puede superar los 4 MB'
  return null
}

/**
 * Recorta la foto con el área elegida y la devuelve como JPEG (máx. 1600 px de lado). `crop` está en píxeles de
 * la imagen tal como se ve en pantalla: se escala a su tamaño real.
 */
export async function cropImage(image: HTMLImageElement, crop: PixelCrop, name: string): Promise<File> {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const sourceWidth = crop.width * scaleX
  const sourceHeight = crop.height * scaleY
  const ratio = Math.min(1, MAX_OUTPUT_SIDE / Math.max(sourceWidth, sourceHeight))

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * ratio))
  canvas.height = Math.max(1, Math.round(sourceHeight * ratio))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la foto')

  // JPEG no tiene transparencia: el fondo de un PNG transparente queda blanco.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new Error('No se pudo procesar la foto')
  const baseName = name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

/**
 * URL de una versión chica y cuadrada de una foto de Cloudinary (recortada al centro, formato y calidad automáticos),
 * para miniaturas. Si la URL no es de Cloudinary, la devuelve igual.
 */
export function imageThumbnailUrl(url: string, size: number): string {
  const marker = '/image/upload/'
  if (!url.includes(marker)) return url
  return url.replace(marker, `${marker}c_fill,w_${size},h_${size},q_auto,f_auto/`)
}
