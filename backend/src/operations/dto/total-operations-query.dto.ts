import { IsEnum } from 'class-validator';
import { OperationType } from '../../generated/prisma/enums.js';
import { DateRangeQueryDto } from './date-range-query.dto.js';

export class TotalOperationsQueryDto extends DateRangeQueryDto {
  @IsEnum(OperationType, {
    message: 'El tipo de operación debe ser "venta" o "compra"',
  })
  type: OperationType;
}
