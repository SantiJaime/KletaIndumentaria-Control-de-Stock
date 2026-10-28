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

// Todos los campos son opcionales: solo se cambia lo que se envía. Las variantes se editan por separado.
export class UpdateProductDto {
  // Reemplaza todos los códigos del producto (se limpian como al crear). `[]` o `null` le quitan todos.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === null ? [] : sanitizeBarcodes(value),
  )
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

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres' })
  name?: string;

  // `null` o texto vacío borran la descripción.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, {
    message: 'La descripción no puede superar los 500 caracteres',
  })
  description?: string | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de compra admite hasta 2 decimales' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Max(9_999_999_999.99, { message: 'El precio es demasiado alto' })
  buyPrice?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta admite hasta 2 decimales' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  @Max(9_999_999_999.99, { message: 'El precio es demasiado alto' })
  sellPrice?: number;
}
