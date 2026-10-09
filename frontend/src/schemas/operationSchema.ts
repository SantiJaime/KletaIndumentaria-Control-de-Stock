import { z } from 'zod'
import { OperationType, type ProductVariant } from '../types'
import { requiredNumber, type NumberInputValue } from './common'

/** El esquema depende de las variantes del producto para validar que una venta no supere el stock elegido. */
export function createOperationSchema(variants: ProductVariant[]) {
  return z
    .object({
      variantId: requiredNumber('Elegí un talle y color'),
      type: z.enum(OperationType, { error: 'Seleccioná un tipo de operación' }),
      quantity: requiredNumber('Ingresá una cantidad').pipe(
        z.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima es 1'),
      ),
    })
    .refine((op) => variants.some((v) => v.id === op.variantId), {
      message: 'Elegí un talle y color',
      path: ['variantId'],
    })
    .refine(
      (op) => {
        const variant = variants.find((v) => v.id === op.variantId)
        return op.type !== OperationType.Venta || !variant || op.quantity <= variant.stock
      },
      { message: 'Stock insuficiente para realizar la venta', path: ['quantity'] },
    )
}

export type OperationOutput = z.output<ReturnType<typeof createOperationSchema>>

export interface OperationFormValues {
  variantId: NumberInputValue
  type: OperationOutput['type']
  quantity: NumberInputValue
}
