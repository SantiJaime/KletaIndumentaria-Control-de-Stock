import { z } from 'zod'
import { variantKey, variantLabel } from '../lib/variants'
import type { NewVariant, ProductVariant } from '../types'
import type { NumberInputValue } from './common'

/**
 * Valores del generador de variantes: talles y colores como etiquetas, y el stock de cada
 * combinación indexado por `variantKey(talle, color)`. Una celda vacía ('') no se crea.
 */
export interface VariantMatrixValues {
  sizes: string[]
  colors: string[]
  stocks: Record<string, NumberInputValue>
}

export const emptyVariantMatrix: VariantMatrixValues = { sizes: [], colors: [], stocks: {} }

const label = (max: number) => z.string().trim().min(1).max(max)

export const variantMatrixShape = {
  sizes: z.array(label(20)),
  colors: z.array(label(30)),
  stocks: z.record(z.string(), z.union([z.number(), z.literal('')])),
}

/** Combinaciones del generador que todavía no existen en el producto. */
export function newCombinations(values: Pick<VariantMatrixValues, 'sizes' | 'colors'>, existing: ProductVariant[]) {
  const taken = new Set(existing.map((v) => variantKey(v.size, v.color)))
  return values.sizes.flatMap((size) =>
    values.colors
      .map((color) => ({ size, color, key: variantKey(size, color) }))
      .filter((combo) => !taken.has(combo.key)),
  )
}

/** Variantes a crear: las combinaciones nuevas con stock cargado (0 incluido). */
export function matrixToVariants(values: VariantMatrixValues, existing: ProductVariant[]): NewVariant[] {
  return newCombinations(values, existing).flatMap(({ size, color, key }) => {
    const stock = values.stocks[key]
    return typeof stock === 'number' ? [{ size, color, stock }] : []
  })
}

/** Validaciones cruzadas del generador; los errores van a `sizes`, `colors` o `stocks`. */
export function refineVariantMatrix(existing: ProductVariant[]) {
  return (values: VariantMatrixValues, ctx: z.RefinementCtx) => {
    if (values.sizes.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Agregá al menos un talle', path: ['sizes'] })
    }
    if (values.colors.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Agregá al menos un color', path: ['colors'] })
    }
    if (values.sizes.length === 0 || values.colors.length === 0) return

    const filled = newCombinations(values, existing).filter(({ key }) => typeof values.stocks[key] === 'number')
    const invalid = filled.find(({ key }) => {
      const stock = values.stocks[key] as number
      return !Number.isInteger(stock) || stock < 0
    })

    if (invalid) {
      ctx.addIssue({
        code: 'custom',
        message: `Stock inválido en ${variantLabel(invalid)}: debe ser un entero mayor o igual a 0`,
        path: ['stocks'],
      })
    } else if (filled.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Cargá el stock de al menos una combinación (las vacías no se crean)',
        path: ['stocks'],
      })
    }
  }
}

const MATRIX_FIELDS = new Set<PropertyKey>(Object.keys(variantMatrixShape))

/**
 * Opciones para `.superRefine(refineVariantMatrix(...), runMatrixRefine)`: la validación corre aunque
 * fallen otros campos del formulario (ej. precios vacíos), siempre que talles, colores y stocks sean válidos.
 */
export const runMatrixRefine = {
  when: (payload: z.core.ParsePayload) => !payload.issues.some((issue) => MATRIX_FIELDS.has(issue.path?.[0] ?? '')),
}

/** Esquema del modal "Nuevas variantes" de un producto existente. */
export function createVariantMatrixSchema(existing: ProductVariant[]) {
  return z
    .object(variantMatrixShape)
    .superRefine(refineVariantMatrix(existing))
    .transform((values) => matrixToVariants(values, existing))
}
