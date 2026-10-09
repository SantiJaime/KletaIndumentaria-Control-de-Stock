import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

// Quita espacios al principio y al final ("  M " -> "M") antes de validar.
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateVariantDto {
  @Transform(trim)
  @IsString({ message: 'El talle debe ser un texto' })
  @IsNotEmpty({ message: 'El talle es obligatorio' })
  @MaxLength(20, { message: 'El talle no puede superar los 20 caracteres' })
  size: string;

  @Transform(trim)
  @IsString({ message: 'El color debe ser un texto' })
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @MaxLength(30, { message: 'El color no puede superar los 30 caracteres' })
  color: string;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;
}
