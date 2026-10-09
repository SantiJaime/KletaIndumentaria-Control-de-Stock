import type { ProductVariant } from '../../generated/prisma/client.js';

// Forma en que la API devuelve una variante.
export class ProductVariantResponseDto {
  id: number;
  size: string;
  color: string;
  stock: number;

  constructor(variant: ProductVariant) {
    this.id = variant.id;
    this.size = variant.size;
    this.color = variant.color;
    this.stock = variant.stock;
  }
}
