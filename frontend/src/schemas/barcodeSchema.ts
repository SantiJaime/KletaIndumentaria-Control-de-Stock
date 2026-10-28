import { z } from 'zod'
import { sanitizeBarcode } from '../lib/barcode'

/** Código de barras limpio (solo letras y números). Lo que sobre se descarta; si no queda nada, es inválido. */
export const cleanBarcode = z
  .string()
  .transform(sanitizeBarcode)
  .pipe(z.string().min(1, 'El código debe tener letras o números'))

/** Máximo de códigos de barras por producto (igual que en la API). */
export const MAX_BARCODES = 20

/** Lista de códigos de un producto (opcional): se limpian y se descartan los vacíos. */
export const barcodeList = z
  .array(z.string())
  .transform((codes) => codes.map(sanitizeBarcode).filter(Boolean))
  .pipe(z.array(z.string()).max(MAX_BARCODES, `Un producto puede tener hasta ${MAX_BARCODES} códigos de barras`))

export const barcodeSchema = z.object({
  barcode: cleanBarcode,
})

export type BarcodeValues = z.input<typeof barcodeSchema>
