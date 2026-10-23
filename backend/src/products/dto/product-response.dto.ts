import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
import { ProductVariantResponseDto } from './product-variant-response.dto.js';

// Lo que devuelve Prisma al buscar un producto incluyendo sus variantes.
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true };
}>;

// Forma en que la API devuelve un producto: precios como number y stock total calculado. No incluye el precio de
// compra: solo lo ve el admin (`AdminProductResponseDto`).
export class ProductResponseDto {
  id: number;
  barcode: string | null;
  name: string;
  description: string | null;
  sellPrice: number;
  totalStock: number;
  variants: ProductVariantResponseDto[];

  constructor(product: ProductWithVariants) {
    this.id = product.id;
    this.barcode = product.barcode;
    this.name = product.name;
    this.description = product.description;
    // Decimal -> number: en JSON un Decimal se serializa como string.
    this.sellPrice = product.sellPrice.toNumber();
    this.variants = product.variants.map(
      (v) => new ProductVariantResponseDto(v),
    );
    this.totalStock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
}

// Producto con el precio de compra: solo para el admin.
export class AdminProductResponseDto extends ProductResponseDto {
  buyPrice: number;

  constructor(product: ProductWithVariants) {
    super(product);
    this.buyPrice = product.buyPrice.toNumber();
  }
}

/** Mapeo de producto a respuesta según quién consulta: el precio de compra solo se le devuelve al admin. */
export const productResponseFor =
  (role: Role) =>
  (product: ProductWithVariants): ProductResponseDto =>
    role === Role.admin
      ? new AdminProductResponseDto(product)
      : new ProductResponseDto(product);
