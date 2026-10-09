import { z } from 'zod'
import { sanitizeBarcode } from '../lib/barcode'

/** Código de barras limpio (solo letras y números). Lo que sobre se descarta; si no queda nada, es inválido. */
export const cleanBarcode = z
  .string()
  .transform(sanitizeBarcode)
  .pipe(z.string().min(1, 'El código debe tener letras o números'))

export const barcodeSchema = z.object({
  barcode: cleanBarcode,
})

export type BarcodeValues = z.input<typeof barcodeSchema>
