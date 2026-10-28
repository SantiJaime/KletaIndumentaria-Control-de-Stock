import type { Prisma } from '../../generated/prisma/client.js';
import { Role } from '../../generated/prisma/enums.js';
import { ProductVariantResponseDto } from './product-variant-response.dto.js';

// Relaciones que hay que traer para armar la respuesta: variantes y códigos de barras, en el orden en que se cargaron.
export const productInclude = {
  variants: { orderBy: { id: 'asc' } },
  barcodes: { orderBy: { id: 'asc' }, select: { code: true } },
} satisfies Prisma.ProductInclude;

// Lo que devuelve Prisma al buscar un producto con `productInclude`.
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Forma en que la API devuelve un producto: precios como number y stock total calculado. No incluye el precio de
// compra: solo lo ve el admin (`AdminProductResponseDto`).
export class ProductResponseDto {
  id: number;
  barcodes: string[];
  name: string;
  description: string | null;
  /** Foto en Cloudinary; `null` si no tiene. */
  imageUrl: string | null;
  sellPrice: number;
  totalStock: number;
  variants: ProductVariantResponseDto[];

  constructor(product: ProductWithVariants) {
    this.id = product.id;
    this.barcodes = product.barcodes.map(({ code }) => code);
    this.name = product.name;
    this.description = product.description;
    this.imageUrl = product.imageUrl;
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
