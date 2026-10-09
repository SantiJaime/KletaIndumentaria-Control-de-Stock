import type { OperationType, Prisma } from '../../generated/prisma/client.js';

// Lo que devuelve Prisma al buscar una operación incluyendo su variante y producto.
export type OperationWithProduct = Prisma.OperationGetPayload<{
  include: { variant: { include: { product: true } } };
}>;

// Forma en que la API devuelve una operación: montos como number y datos del producto aplanados.
export class OperationResponseDto {
  id: number;
  createdAt: string;
  type: OperationType;
  quantity: number;
  unitPrice: number;
  total: number;
  variantId: number;
  size: string;
  color: string;
  productId: number;
  barcode: string | null;
  name: string;

  constructor(operation: OperationWithProduct) {
    const { variant } = operation;
    this.id = operation.id;
    this.createdAt = operation.createdAt.toISOString();
    this.type = operation.type;
    this.quantity = operation.quantity;
    this.unitPrice = operation.unitPrice.toNumber();
    this.total = operation.total.toNumber();
    this.variantId = variant.id;
    this.size = variant.size;
    this.color = variant.color;
    this.productId = variant.product.id;
    this.barcode = variant.product.barcode;
    this.name = variant.product.name;
  }
}
