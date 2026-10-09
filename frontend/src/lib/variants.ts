import type { ProductVariant } from '../types'

/** Orden habitual de talles en letras; los numéricos se ordenan de menor a mayor. */
const LETTER_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

function sizeRank(size: string): number {
  const letter = LETTER_SIZES.indexOf(size.toUpperCase())
  if (letter !== -1) return letter
  const numeric = Number(size)
  // Los numéricos van después de los de letras; el resto ("Único", etc.) al final.
  return Number.isFinite(numeric) ? 100 + numeric : Infinity
}

/** Ordena talles: letras (XS → XXL), después numéricos y al final el resto. */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b))
}

/** Talles distintos de las variantes, en orden de talle. */
export function sortedSizes(variants: ProductVariant[]): string[] {
  return sortSizes([...new Set(variants.map((v) => v.size))])
}

/** Colores distintos de las variantes, en el orden en que aparecen. */
export function uniqueColors(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.color))]
}

export function totalStock(variants: ProductVariant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0)
}

export function variantLabel(variant: Pick<ProductVariant, 'size' | 'color'>): string {
  return `${variant.size} / ${variant.color}`
}

/** Para comparar talles y colores sin distinguir mayúsculas ni espacios. */
export function normalizeLabel(value: string): string {
  return value.trim().toLowerCase()
}

/** Clave única de una combinación de talle y color (sin distinguir mayúsculas). */
export function variantKey(size: string, color: string): string {
  return `${normalizeLabel(size)}|${normalizeLabel(color)}`
}
