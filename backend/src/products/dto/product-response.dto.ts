import type { Prisma } from '../../generated/prisma/client.js';
import { ProductVariantResponseDto } from './product-variant-response.dto.js';

// Lo que devuelve Prisma al buscar un producto incluyendo sus variantes.
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

// Forma en que la API devuelve un producto: precios como number y stock total calculado.
export class ProductResponseDto {
  id: number;
  barcode: string | null;
  name: string;
  description: string | null;
  buyPrice: number;
  sellPrice: number;
  totalStock: number;
  variants: ProductVariantResponseDto[];

  constructor(product: ProductWithVariants) {
    this.id = product.id;
    this.barcode = product.barcode;
    this.name = product.name;
    this.description = product.description;
    // Decimal -> number: en JSON un Decimal se serializa como string.
    this.buyPrice = product.buyPrice.toNumber();
    this.sellPrice = product.sellPrice.toNumber();
    this.variants = product.variants.map(
      (v) => new ProductVariantResponseDto(v),
    );
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
}
