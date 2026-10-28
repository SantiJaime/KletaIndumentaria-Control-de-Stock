import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { sanitizeBarcode } from '../barcode.util.js';

// Código a agregar a un producto existente. Se limpia antes de validar ("C-123 45!" queda "C12345").
export class AddBarcodeDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? sanitizeBarcode(value) : value,
  )
  @IsString({ message: 'El código de barras debe ser un texto' })
  @IsNotEmpty({ message: 'El código debe tener letras o números' })
  @MaxLength(50, { message: 'El código puede tener hasta 50 caracteres' })
  barcode: string;
}
