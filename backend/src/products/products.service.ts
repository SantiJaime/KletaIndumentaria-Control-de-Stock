import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateVariantsDto } from './dto/create-variants.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateVariantsDto } from './dto/update-variants.dto.js';
import { sanitizeBarcode } from './barcode.util.js';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto.js';
import { ProductResponseDto } from './dto/product-response.dto.js';

// Clave de una combinación sin distinguir mayúsculas: en la DB la restricción única sí las distingue.
const variantKey = (v: { size: string; color: string }) =>
  `${v.size.toLowerCase()}|${v.color.toLowerCase()}`;

const variantLabel = (v: { size: string; color: string }) =>
  `${v.size} / ${v.color}`;

const conflictError = (labels: string[]) =>
  new ConflictException({
    message: `Ya existen las variantes: ${labels.join(', ')}`,
    conflicts: labels,
  });

// Variantes ordenadas por id, para incluir al devolver un producto.
const withVariants = {
  variants: { orderBy: { id: 'asc' } },
} satisfies Prisma.ProductInclude;

// Los productos eliminados (soft delete) no se ven en ninguna búsqueda.
const notDeleted = { deletedAt: null } satisfies Prisma.ProductWhereInput;

/** Productos por página en el listado. */
export const PAGE_SIZE = 50;

/** Máximo de resultados de la búsqueda por nombre. */
const SEARCH_LIMIT = 20;

/** Similitud mínima (0 a 1) para tolerar errores de tipeo: "remara" encuentra "Remera". */
const SEARCH_MIN_SIMILARITY = 0.3;

// Escapa los comodines de LIKE para que "50%" se busque literalmente.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    variants,
    ...data
  }: CreateProductDto): Promise<ProductResponseDto> {
    if (data.sellPrice < data.buyPrice) {
      throw new BadRequestException(
        'El precio de venta no puede ser menor al de compra',
      );
    }

    const { barcode } = data;
    if (barcode) {
      // Incluye los eliminados: conservan su código de barras (es único en la DB).
      const sameBarcode = await this.prisma.product.findFirst({
        where: { barcode: { equals: barcode, mode: 'insensitive' } },
        select: { deletedAt: true },
      });
      if (sameBarcode) {
        throw new ConflictException(
          sameBarcode.deletedAt
            ? `El código ${barcode} pertenece a un producto eliminado`
            : `Ya existe un producto con el código ${barcode}`,
        );
      }
    }

    try {
      // Nested write: el producto y sus variantes se crean en una sola transacción.
      const product = await this.prisma.product.create({
        data: {
          barcode: barcode ?? null,
          name: data.name,
          description: data.description,
          buyPrice: data.buyPrice,
          sellPrice: data.sellPrice,
          variants: {
            create: variants.map(({ size, color, stock }) => ({
              size,
              color,
              stock,
            })),
          },
        },
        include: withVariants,
      });
      return new ProductResponseDto(product);
    } catch (error) {
      // Otra request creó el mismo código entre la verificación y el insert.
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          barcode
            ? `Ya existe un producto con el código ${barcode}`
            : 'Ya existe un producto con esos datos',
        );
      }
      throw error;
    }
  }

  async findAll(page = 1): Promise<PaginatedProductsResponseDto> {
    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where: notDeleted }),
      this.prisma.product.findMany({
        where: notDeleted,
        include: withVariants,
        // El id desempata nombres iguales para que las páginas no se repitan ni salteen productos.
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);
    return new PaginatedProductsResponseDto(products, total, page, PAGE_SIZE);
  }

  /**
   * Busca por nombre con pg_trgm (similar a Atlas Search): encuentra coincidencias parciales
   * ("remer") y tolera pocos errores de tipeo ("remara"). Ordena de más a menos parecido.
   */
  async findByName(name: string): Promise<ProductResponseDto[]> {
    const ids = await this.findIdsByName(name);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, ...notDeleted },
      include: withVariants,
    });
    // findMany no respeta el orden de `in`: se reordena según el ranking.
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.flatMap((id) => {
      const product = byId.get(id);
      return product ? [new ProductResponseDto(product)] : [];
    });
  }

  async findOne(id: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, ...notDeleted },
      include: withVariants,
    });
    if (!product) {
      throw new NotFoundException(`No existe un producto con id ${id}`);
    }
    return new ProductResponseDto(product);
  }

  async findByBarcode(barcode: string): Promise<ProductResponseDto> {
    const product = await this.findProductByBarcode(barcode);
    if (!product) {
      throw new NotFoundException(
        `No existe un producto con el código ${barcode}`,
      );
    }
    return new ProductResponseDto(product);
  }

  /**
   * Para cuando no se sabe si el usuario escribió un código o un nombre: primero busca por código
   * exacto (si hay coincidencia es la respuesta) y, si no, por nombre. Siempre devuelve una lista.
   */
  async findByBarcodeOrName(term: string): Promise<ProductResponseDto[]> {
    const barcode = sanitizeBarcode(term);
    if (barcode) {
      const product = await this.findProductByBarcode(barcode);
      if (product) return [new ProductResponseDto(product)];
    }
    return this.findByName(term);
  }

  private findProductByBarcode(barcode: string) {
    // Sin distinguir mayúsculas, igual que la búsqueda del frontend.
    return this.prisma.product.findFirst({
      where: {
        barcode: { equals: barcode, mode: 'insensitive' },
        ...notDeleted,
      },
      include: withVariants,
    });
  }

  /** Ids de los productos (no eliminados) que coinciden con el nombre, de más a menos parecido. */
  async findIdsByName(name: string): Promise<number[]> {
    // El umbral de `<%` es una variable de sesión: con `set_config(..., true)` vale solo dentro de esta
    // transacción (no ensucia la conexión del pooler).
    const rows = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('pg_trgm.word_similarity_threshold', ${String(SEARCH_MIN_SIMILARITY)}, true)`;
      // Las dos condiciones usan el índice GIN (name_trgm): ILIKE para el texto exacto y `<%` para el parecido.
      return tx.$queryRaw<{ id: number }[]>`
        SELECT id
        FROM products
        WHERE deleted_at IS NULL
          AND (
            name ILIKE '%' || ${escapeLike(name)} || '%'
            OR ${name}::text <% name
          )
        ORDER BY word_similarity(${name}::text, name) DESC, similarity(${name}::text, name) DESC, name ASC, id ASC
        LIMIT ${SEARCH_LIMIT}`;
    });
    return rows.map(({ id }) => id);
  }

  /** Ids de los productos que coinciden con el código exacto o, si no hay, con el nombre. */
  async findIdsByBarcodeOrName(term: string): Promise<number[]> {
    const barcode = sanitizeBarcode(term);
    if (barcode) {
      const product = await this.findProductByBarcode(barcode);
      if (product) return [product.id];
    }
    return this.findIdsByName(term);
  }

  /** Crea varias variantes de una vez: o se crean todas o ninguna. */
  async addVariants(
    productId: number,
    { variants }: CreateVariantsDto,
  ): Promise<ProductResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const product = await tx.product.findFirst({
          where: { id: productId, ...notDeleted },
          include: { variants: true },
        });
        if (!product) {
          throw new NotFoundException(
            `No existe un producto con id ${productId}`,
          );
        }

        const existing = new Set(product.variants.map(variantKey));
        const conflicts = variants.filter((v) => existing.has(variantKey(v)));
        if (conflicts.length > 0) {
          throw conflictError(conflicts.map(variantLabel));
        }

        await tx.productVariant.createMany({
          data: variants.map(({ size, color, stock }) => ({
            size,
            color,
            stock,
            productId,
          })),
        });

        const updated = await tx.product.findUniqueOrThrow({
          where: { id: productId },
          include: withVariants,
        });
        return new ProductResponseDto(updated);
      });
    } catch (error) {
      // Otra request creó la misma variante entre la verificación y el insert.
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Alguna de las variantes ya existe. Recargá el producto e intentá de nuevo.',
        );
      }
      throw error;
    }
  }

  /** Actualiza solo los campos enviados. `barcode: null` le quita el código al producto. */
  async update(
    id: number,
    { barcode, ...data }: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const current = await this.prisma.product.findFirst({
      where: { id, ...notDeleted },
    });
    if (!current) {
      throw new NotFoundException(`No existe un producto con id ${id}`);
    }

    const buyPrice = data.buyPrice ?? current.buyPrice.toNumber();
    const sellPrice = data.sellPrice ?? current.sellPrice.toNumber();
    if (sellPrice < buyPrice) {
      throw new BadRequestException(
        'El precio de venta no puede ser menor al de compra',
      );
    }

    if (barcode && barcode.toLowerCase() !== current.barcode?.toLowerCase()) {
      // Incluye los eliminados: conservan su código de barras (es único en la DB).
      const sameBarcode = await this.prisma.product.findFirst({
        where: {
          barcode: { equals: barcode, mode: 'insensitive' },
          id: { not: id },
        },
        select: { deletedAt: true },
      });
      if (sameBarcode) {
        throw new ConflictException(
          sameBarcode.deletedAt
            ? `El código ${barcode} pertenece a un producto eliminado`
            : `Ya existe un producto con el código ${barcode}`,
        );
      }
    }

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: { ...data, ...(barcode !== undefined && { barcode }) },
        include: withVariants,
      });
      return new ProductResponseDto(product);
    } catch (error) {
      // Otra request tomó el mismo código entre la verificación y el update.
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `Ya existe un producto con el código ${barcode}`,
        );
      }
      throw error;
    }
  }

  /**
   * Actualiza varias variantes en una sola transacción: o se guardan todas o ninguna. Valida que, con los
   * cambios, no queden dos variantes del producto con el mismo talle y color.
   */
  async updateVariants(
    productId: number,
    { variants: changes }: UpdateVariantsDto,
  ): Promise<ProductResponseDto> {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId, product: notDeleted },
    });
    if (variants.length === 0) {
      throw new NotFoundException(`No existe un producto con id ${productId}`);
    }

    const byId = new Map(variants.map((v) => [v.id, v]));
    const missing = changes.filter(({ id }) => !byId.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        `No existen las variantes ${missing.map(({ id }) => id).join(', ')} en el producto ${productId}`,
      );
    }

    // Cómo queda cada variante después de los cambios.
    const changesById = new Map(changes.map((c) => [c.id, c]));
    const finalVariants = variants.map((v) => ({
      ...v,
      ...Object.fromEntries(
        Object.entries(changesById.get(v.id) ?? {}).filter(
          ([, value]) => value !== undefined,
        ),
      ),
    }));
    const seen = new Set<string>();
    const duplicates = finalVariants.filter((v) => {
      const key = variantKey(v);
      const isDuplicate = seen.has(key);
      seen.add(key);
      return isDuplicate;
    });
    if (duplicates.length > 0)
      throw conflictError(duplicates.map(variantLabel));

    try {
      await this.prisma.$transaction(
        changes.map(({ id, size, color, stock }) =>
          this.prisma.productVariant.update({
            where: { id },
            data: { size, color, stock },
          }),
        ),
      );
    } catch (error) {
      // Dos variantes cambiaron a la vez a una combinación que ya existía (ej. intercambiar talles).
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Hay variantes con el mismo talle y color. Revisá los cambios e intentá de nuevo.',
        );
      }
      throw error;
    }
    return this.findOne(productId);
  }

  /** Soft delete: el producto deja de verse, pero se conserva con sus variantes y su historial. */
  async remove(id: number) {
    const { count } = await this.prisma.product.updateMany({
      where: { id, ...notDeleted },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException(`No existe un producto con id ${id}`);
    }
  }

  /** Borra la variante definitivamente; si tiene operaciones registradas no se puede. */
  async removeVariant(
    productId: number,
    variantId: number,
  ): Promise<ProductResponseDto> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId, product: notDeleted },
      include: { _count: { select: { operations: true } } },
    });
    if (!variant) {
      throw new NotFoundException(
        `No existe la variante ${variantId} en el producto ${productId}`,
      );
    }
    if (variant._count.operations > 0) {
      throw new ConflictException(
        `La variante ${variantLabel(variant)} tiene operaciones registradas y no se puede borrar`,
      );
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return this.findOne(productId);
  }
}
