import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
} from 'class-validator';
import { sanitizeBarcode } from '../barcode.util.js';

// Todos los campos son opcionales: solo se cambia lo que se envía. Las variantes se editan por separado.
export class UpdateProductDto {
  // Se limpia como al crear. Un texto sin letras ni números (o `null`) le quita el código al producto.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? sanitizeBarcode(value) || null : value,
  )
  @IsString({ message: 'El código de barras debe ser un texto' })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'El código sólo puede contener letras y números',
  })
  barcode?: string | null;

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
