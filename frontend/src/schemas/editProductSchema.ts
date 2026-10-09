import { z } from 'zod'
import { sanitizeBarcode } from '../lib/barcode'
import { variantKey } from '../lib/variants'
import { requiredNumber, type NumberInputValue } from './common'

const price = (label: string) =>
  requiredNumber(`Ingresá el precio ${label}`).pipe(z.number().positive('El precio debe ser mayor a 0'))

export const editProductSchema = z
  .object({
    // Opcional: sin letras ni números queda en `null` (se le quita el código al producto).
    barcode: z.string().transform((value) => sanitizeBarcode(value) || null),
    name: z
      .string()
      .trim()
      .min(1, 'Ingresá el nombre del producto')
      .max(80, 'El nombre no puede superar los 80 caracteres'),
    buyPrice: price('de compra'),
    sellPrice: price('de venta'),
  })
  .refine((p) => p.sellPrice >= p.buyPrice, {
    message: 'El precio de venta no puede ser menor al de compra',
    path: ['sellPrice'],
  })

export interface EditProductFormValues {
  barcode: string
  name: string
  buyPrice: NumberInputValue
  sellPrice: NumberInputValue
}

const editVariantSchema = z.object({
  id: z.number(),
  size: z.string().trim().min(1, 'Ingresá el talle').max(20, 'Máximo 20 caracteres'),
  color: z.string().trim().min(1, 'Ingresá el color').max(30, 'Máximo 30 caracteres'),
  stock: requiredNumber('Ingresá el stock').pipe(
    z.number().int('Debe ser un número entero').min(0, 'No puede ser negativo'),
  ),
})

export const editVariantsSchema = z
  .object({ variants: z.array(editVariantSchema) })
  // No puede haber dos variantes con el mismo talle y color (sin distinguir mayúsculas).
  .superRefine(({ variants }, ctx) => {
    const seen = new Set<string>()
    variants.forEach((v, index) => {
      const key = variantKey(v.size.trim(), v.color.trim())
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ya hay otra variante con ese talle y color',
          path: ['variants', index, 'size'],
        })
      }
      seen.add(key)
    })
  })

/** Una variante en el formulario: el stock puede estar vacío mientras se escribe. */
export interface EditVariantFormValue {
  id: number
  size: string
  color: string
  stock: NumberInputValue
}

export interface EditVariantsFormValues {
  variants: EditVariantFormValue[]
}
