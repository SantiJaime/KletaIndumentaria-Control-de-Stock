import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchProductsQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'Ingresá al menos 2 caracteres para buscar' })
  @MaxLength(100, { message: 'El nombre es demasiado largo' })
  name: string;
}
