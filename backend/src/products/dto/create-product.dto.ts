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
import { CreateVariantsDto } from './create-variants.dto.js';

// Hereda `variants` (con sus validaciones) de CreateVariantsDto.
export class CreateProductDto extends CreateVariantsDto {
  // Opcional: hay productos sin código de barras. Se limpia antes de validar ("C-123 45!" queda
  // "C12345") y si no queda nada se trata como si no se hubiera enviado.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? sanitizeBarcode(value) || undefined : value,
  )
  @IsString({ message: 'El código de barras debe ser un texto' })
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'El código sólo puede contener letras y números',
  })
  barcode?: string;

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
