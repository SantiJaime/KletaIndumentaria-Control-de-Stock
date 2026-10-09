import { z } from 'zod'
import { sanitizeBarcode } from '../lib/barcode'
import { requiredNumber, type NumberInputValue } from './common'
import {
  matrixToVariants,
  refineVariantMatrix,
  runMatrixRefine,
  variantMatrixShape,
  type VariantMatrixValues,
} from './variantMatrixSchema'

const price = (label: string) =>
  requiredNumber(`Ingresá el precio ${label}`).pipe(z.number().positive('El precio debe ser mayor a 0'))

export const productSchema = z
  .object({
    // Opcional: sin letras ni números queda en `null` (producto sin código de barras).
    barcode: z.string().transform((value) => sanitizeBarcode(value) || null),
    name: z
      .string()
      .trim()
      .min(1, 'Ingresá el nombre del producto')
      .max(80, 'El nombre no puede superar los 80 caracteres'),
    buyPrice: price('de compra'),
    sellPrice: price('de venta'),
    ...variantMatrixShape,
  })
  .refine((p) => p.sellPrice >= p.buyPrice, {
    message: 'El precio de venta no puede ser menor al de compra',
    path: ['sellPrice'],
  })
  // Producto nuevo: no hay variantes existentes contra las que comparar.
  .superRefine(refineVariantMatrix([]), runMatrixRefine)
  // Talles, colores y stocks se convierten en la lista de variantes a crear.
  .transform(({ sizes, colors, stocks, ...product }) => ({
    ...product,
    variants: matrixToVariants({ sizes, colors, stocks }, []),
  }))

export type ProductOutput = z.output<typeof productSchema>

export interface ProductFormValues extends VariantMatrixValues {
  barcode: string
  name: string
  buyPrice: NumberInputValue
  sellPrice: NumberInputValue
}
