import { IsEnum, IsInt, IsPositive, Min } from 'class-validator';
import { OperationType } from '../../generated/prisma/enums.js';

export class CreateOperationDto {
  @IsInt({ message: 'La variante debe ser un id numérico' })
  @IsPositive({ message: 'La variante debe ser un id numérico' })
  variantId: number;

  @IsEnum(OperationType, {
    message: 'El tipo de operación debe ser "venta" o "compra"',
  })
  type: OperationType;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  quantity: number;
}
