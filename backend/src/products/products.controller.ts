import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import type { AccessTokenPayload } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { PAGE_SIZE, ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateVariantsDto } from './dto/create-variants.dto.js';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto.js';
import {
  AdminProductResponseDto,
  productResponseFor,
} from './dto/product-response.dto.js';
import { LookupProductsQueryDto } from './dto/lookup-products-query.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { SearchProductsQueryDto } from './dto/search-products-query.dto.js';
import { SanitizeBarcodePipe } from './pipes/sanitize-barcode.pipe.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateVariantsDto } from './dto/update-variants.dto.js';

// El service devuelve los productos de Prisma y acá se arma la respuesta: las lecturas usan `productResponseFor`
// (el precio de compra solo lo ve el admin) y las rutas de admin devuelven `AdminProductResponseDto`.
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Dar de alta productos y variantes es solo para administradores (el alta carga stock inicial).
  @Roles(Role.admin)
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return new AdminProductResponseDto(
      await this.productsService.create(createProductDto),
    );
  }

  @Get()
  async findAll(
    @Query() { page }: PaginationQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const { products, total } = await this.productsService.findAll(page);
    return new PaginatedProductsResponseDto(
      products.map(productResponseFor(user.role)),
      total,
      page,
      PAGE_SIZE,
    );
  }

  // Va antes de ':id' para que "lookup" no se tome como un id.
  @Get('lookup')
  async findByBarcodeOrName(
    @Query() { term }: LookupProductsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const products = await this.productsService.findByBarcodeOrName(term);
    return products.map(productResponseFor(user.role));
  }

  @Get('search')
  async findByName(
    @Query() { name }: SearchProductsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const products = await this.productsService.findByName(name);
    return products.map(productResponseFor(user.role));
  }

  // Va antes de ':id' para que "barcode" no se tome como un id.
  @Get('barcode/:barcode')
  async findByBarcode(
    @Param('barcode', SanitizeBarcodePipe) barcode: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return productResponseFor(user.role)(
      await this.productsService.findByBarcode(barcode),
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return productResponseFor(user.role)(
      await this.productsService.findOne(id),
    );
  }

  @Roles(Role.admin)
  @Post(':id/variants')
  async addVariants(
    @Param('id', ParseIntPipe) id: number,
    @Body() createVariantsDto: CreateVariantsDto,
  ) {
    return new AdminProductResponseDto(
      await this.productsService.addVariants(id, createVariantsDto),
    );
  }

  // Editar productos y variantes también es solo para administradores.
  @Roles(Role.admin)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return new AdminProductResponseDto(
      await this.productsService.update(id, updateProductDto),
    );
  }

  // Actualiza varias variantes de una vez (en una sola transacción) y devuelve el producto actualizado.
  @Roles(Role.admin)
  @Patch(':id/variants')
  async updateVariants(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVariantsDto: UpdateVariantsDto,
  ) {
    return new AdminProductResponseDto(
      await this.productsService.updateVariants(id, updateVariantsDto),
    );
  }

  // Soft delete: responde 204 sin contenido.
  @Roles(Role.admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  // Devuelve el producto actualizado, sin la variante borrada.
  @Roles(Role.admin)
  @Delete(':id/variants/:variantId')
  async removeVariant(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return new AdminProductResponseDto(
      await this.productsService.removeVariant(id, variantId),
    );
  }
}
