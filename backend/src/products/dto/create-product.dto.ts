import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { MAX_BARCODES, sanitizeBarcodes } from '../barcode.util.js';
import { CreateVariantsDto } from './create-variants.dto.js';

// Hereda `variants` (con sus validaciones) de CreateVariantsDto.
export class CreateProductDto extends CreateVariantsDto {
  // Opcional: hay productos sin código de barras y otros con varios. Cada código se limpia antes de validar
  // ("C-123 45!" queda "C12345"); los vacíos y los repetidos se descartan.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => sanitizeBarcodes(value))
  @IsArray({ message: 'Los códigos de barras deben ser una lista' })
  @ArrayMaxSize(MAX_BARCODES, {
    message: `Un producto puede tener hasta ${MAX_BARCODES} códigos de barras`,
  })
  @IsString({ each: true, message: 'Cada código de barras debe ser un texto' })
  @MaxLength(50, {
    each: true,
    message: 'Cada código puede tener hasta 50 caracteres',
  })
  barcodes?: string[];

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description?: string;

  // Decimal(12,2) en la DB: hasta 2 decimales y 10 dígitos enteros.
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de compra admite hasta 2 decimales' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Max(9_999_999_999.99, { message: 'El precio es demasiado alto' })
  buyPrice: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta admite hasta 2 decimales' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Max(9_999_999_999.99, { message: 'El precio es demasiado alto' })
  sellPrice: number;
}
