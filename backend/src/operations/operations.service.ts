import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { OperationType } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductResponseDto } from '../products/dto/product-response.dto.js';
import { CreateOperationDto } from './dto/create-operation.dto.js';
import { ProductsService } from '../products/products.service.js';
import {
  operationInclude,
  OperationResponseDto,
} from './dto/operation-response.dto.js';
import { PaginatedOperationsResponseDto } from './dto/paginated-operations-response.dto.js';
import { OperationsTotalResponseDto } from './dto/operations-total-response.dto.js';
import { TotalOperationsQueryDto } from './dto/total-operations-query.dto.js';
import { ListOperationsQueryDto } from './dto/list-operations-query.dto.js';

/** Operaciones por página en el historial. */
const PAGE_SIZE = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

// Argentina no tiene horario de verano: el offset es fijo.
const startOfDay = (isoDate: string) => new Date(`${isoDate}T00:00:00-03:00`);

// Día de hoy en Argentina (yyyy-mm-dd); el locale en-CA da ese formato.
const todayInArgentina = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());

/** Valida el rango y lo convierte al filtro de `createdAt`: desde las 00:00 de `fromDate` hasta antes de las 00:00 del día siguiente a `toDate` (días de Argentina). */
function dateRangeFilter(fromDate: string, toDate: string) {
  if (toDate < fromDate) {
    throw new BadRequestException(
      'La fecha hasta no puede ser anterior a la fecha desde',
    );
  }

  const today = todayInArgentina();
  const errors = [
    fromDate > today && 'La fecha desde no puede ser futura',
    toDate > today && 'La fecha hasta no puede ser futura',
  ].filter((message) => message !== false);
  if (errors.length > 0) throw new BadRequestException(errors);

  return {
    gte: startOfDay(fromDate),
    lt: new Date(startOfDay(toDate).getTime() + DAY_MS),
  };
}

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Operaciones entre dos fechas (inclusive), de la más nueva a la más vieja, 50 por página.
   * Opcionalmente solo las de los productos que coinciden con `term` (código o nombre).
   */
  async findAll({
    fromDate,
    toDate,
    term,
    page,
  }: ListOperationsQueryDto): Promise<PaginatedOperationsResponseDto> {
    const createdAt = dateRangeFilter(fromDate, toDate);

    const where: Prisma.OperationWhereInput = {
      createdAt,
    };
    if (term) {
      const productIds =
        await this.productsService.findIdsByBarcodeOrName(term);
      if (productIds.length === 0) {
        return new PaginatedOperationsResponseDto([], 0, page, PAGE_SIZE);
      }
      where.variant = { productId: { in: productIds } };
    }

    const [total, operations] = await this.prisma.$transaction([
      this.prisma.operation.count({ where }),
      this.prisma.operation.findMany({
        where,
        include: operationInclude,
        // El id desempata operaciones con la misma fecha para que las páginas no se repitan ni salteen filas.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    return new PaginatedOperationsResponseDto(
      operations,
      total,
      page,
      PAGE_SIZE,
    );
  }

  /**
   * Monto total y cantidad de operaciones de un tipo entre dos fechas (inclusive), calculado en la base.
   * Las anuladas no cuentan.
   */
  async getTotal(query: TotalOperationsQueryDto) {
    const { fromDate, toDate, type } = query;
    const { _sum, _count } = await this.prisma.operation.aggregate({
      where: {
        type,
        createdAt: dateRangeFilter(fromDate, toDate),
        cancelledAt: null,
      },
      _sum: { total: true },
      _count: true,
    });
    return new OperationsTotalResponseDto(
      query,
      _sum.total?.toNumber() ?? 0,
      _count,
    );
  }

  /**
   * Registra una venta (resta stock) o una compra (suma stock) de una variante.
   * Devuelve la operación y el producto con el stock actualizado. `userId` es quien la registra.
   */
  create({ variantId, type, quantity }: CreateOperationDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, product: { deletedAt: null } },
        include: { product: true },
      });
      if (!variant) {
        throw new NotFoundException(`No existe la variante ${variantId}`);
      }

      if (type === OperationType.venta) {
        // La condición `stock >= quantity` va en el mismo UPDATE: si dos ventas llegan a la vez,
        // la segunda no puede dejar el stock negativo.
        const { count } = await tx.productVariant.updateMany({
          where: { id: variantId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (count === 0) {
          throw new ConflictException(
            `Stock insuficiente: quedan ${variant.stock} unidades de ${variant.size} / ${variant.color}`,
          );
        }
      } else {
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: { increment: quantity } },
        });
      }

      // Precio del momento: si después cambia el precio del producto, el historial no se altera.
      const unitPrice =
        type === OperationType.venta
          ? variant.product.sellPrice
          : variant.product.buyPrice;
      const operation = await tx.operation.create({
        data: {
          type,
          quantity,
          unitPrice,
          total: unitPrice.mul(quantity),
          variantId,
          userId,
        },
        include: operationInclude,
      });

      const product = await tx.product.findUniqueOrThrow({
        where: { id: variant.productId },
        include: { variants: { orderBy: { id: 'asc' } } },
      });

      return {
        operation: new OperationResponseDto(operation),
        product: new ProductResponseDto(product),
      };
    });
  }

  /**
   * Anula una operación: queda en el historial marcada como anulada (con fecha y quién la anuló) y el stock
   * vuelve a como estaba antes: la venta anulada lo devuelve y la compra anulada lo quita.
   */
  cancel(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const operation = await tx.operation.findUnique({
        where: { id },
        include: { variant: true },
      });
      if (!operation) {
        throw new NotFoundException(`No existe la operación ${id}`);
      }

      // La condición `cancelledAt: null` va en el mismo UPDATE: si dos anulaciones llegan a la vez,
      // la segunda no revierte el stock de nuevo.
      const { count } = await tx.operation.updateMany({
        where: { id, cancelledAt: null },
        data: { cancelledAt: new Date(), cancelledById: userId },
      });
      if (count === 0) {
        throw new ConflictException('La operación ya estaba anulada');
      }

      const { variant, quantity } = operation;
      if (operation.type === OperationType.venta) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: quantity } },
        });
      } else {
        // Las unidades de la compra pueden haberse vendido: el stock no puede quedar negativo.
        const updated = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (updated.count === 0) {
          throw new ConflictException(
            `No se puede anular la compra: habría que quitar ${quantity} unidades de ${variant.size} / ${variant.color} y en stock hay ${variant.stock}`,
          );
        }
      }

      const cancelled = await tx.operation.findUniqueOrThrow({
        where: { id },
        include: operationInclude,
      });
      return new OperationResponseDto(cancelled);
    });
  }
}
