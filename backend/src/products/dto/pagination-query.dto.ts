import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page: number = 1;
}
