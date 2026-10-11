import type { OperationType, Prisma } from '../../generated/prisma/client.js';

// Relaciones que hay que traer para armar la respuesta: variante y producto, quién la registró y quién la anuló.
export const operationInclude = {
  variant: { include: { product: true } },
  user: { select: { username: true } },
  cancelledBy: { select: { username: true } },
} satisfies Prisma.OperationInclude;

// Lo que devuelve Prisma al buscar una operación con `operationInclude`.
export type OperationWithRelations = Prisma.OperationGetPayload<{
  include: typeof operationInclude;
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
  /** Usuario que la registró; `null` en las operaciones viejas, de antes de guardarlo. */
  username: string | null;
  /** Fecha ISO de la anulación; `null` si la operación está vigente. */
  cancelledAt: string | null;
  /** Usuario que la anuló. */
  cancelledBy: string | null;

  constructor(operation: OperationWithRelations) {
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
    this.username = operation.user?.username ?? null;
    this.cancelledAt = operation.cancelledAt?.toISOString() ?? null;
    this.cancelledBy = operation.cancelledBy?.username ?? null;
  }
}
