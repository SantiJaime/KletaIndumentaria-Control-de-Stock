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
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../generated/prisma/enums.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CreateVariantsDto } from './dto/create-variants.dto.js';
import { LookupProductsQueryDto } from './dto/lookup-products-query.dto.js';
import { PaginationQueryDto } from './dto/pagination-query.dto.js';
import { SearchProductsQueryDto } from './dto/search-products-query.dto.js';
import { SanitizeBarcodePipe } from './pipes/sanitize-barcode.pipe.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UpdateVariantsDto } from './dto/update-variants.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() { page }: PaginationQueryDto) {
    return this.productsService.findAll(page);
  }

  // Va antes de ':id' para que "lookup" no se tome como un id.
  @Get('lookup')
  findByBarcodeOrName(@Query() { term }: LookupProductsQueryDto) {
    return this.productsService.findByBarcodeOrName(term);
  }

  @Get('search')
  findByName(@Query() { name }: SearchProductsQueryDto) {
    return this.productsService.findByName(name);
  }

  // Va antes de ':id' para que "barcode" no se tome como un id.
  @Get('barcode/:barcode')
  findByBarcode(@Param('barcode', SanitizeBarcodePipe) barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post(':id/variants')
  addVariants(
    @Param('id', ParseIntPipe) id: number,
    @Body() createVariantsDto: CreateVariantsDto,
  ) {
    return this.productsService.addVariants(id, createVariantsDto);
  }

  // Editar productos y variantes es solo para administradores.
  @Roles(Role.admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // Actualiza varias variantes de una vez (en una sola transacción) y devuelve el producto actualizado.
  @Roles(Role.admin)
  @Patch(':id/variants')
  updateVariants(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVariantsDto: UpdateVariantsDto,
  ) {
    return this.productsService.updateVariants(id, updateVariantsDto);
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
  removeVariant(
    @Param('id', ParseIntPipe) id: number,
    @Param('variantId', ParseIntPipe) variantId: number,
  ) {
    return this.productsService.removeVariant(id, variantId);
  }
}
