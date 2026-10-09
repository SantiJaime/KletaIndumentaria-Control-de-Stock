import { Transform } from 'class-transformer';
import { IntersectionType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../products/dto/pagination-query.dto.js';
import { DateRangeQueryDto } from './date-range-query.dto.js';

export class ListOperationsQueryDto extends IntersectionType(
  DateRangeQueryDto,
  PaginationQueryDto,
) {
  // Opcional: código de barras o nombre del producto (con tolerancia a errores de tipeo).
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsString({ message: 'La búsqueda debe ser un texto' })
  @MinLength(2, { message: 'Ingresá al menos 2 caracteres para buscar' })
  @MaxLength(100, { message: 'La búsqueda es demasiado larga' })
  term?: string;
}
