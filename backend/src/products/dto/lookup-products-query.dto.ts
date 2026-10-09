import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LookupProductsQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MinLength(2, { message: 'Ingresá al menos 2 caracteres para buscar' })
  @MaxLength(100, { message: 'La búsqueda es demasiado larga' })
  term: string;
}
