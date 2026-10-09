import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { CreateVariantDto } from './create-variant.dto.js';

// Una variante a modificar: su id y solo los campos que cambian (talle, color y/o stock).
export class UpdateVariantItemDto extends PartialType(CreateVariantDto) {
  @IsInt({ message: 'El id de la variante debe ser un número entero' })
  @IsPositive({ message: 'El id de la variante debe ser un número entero' })
  id: number;
}

export class UpdateVariantsDto {
  @IsArray({ message: 'Las variantes deben ser una lista' })
  @ArrayMinSize(1, { message: 'Enviá al menos una variante' })
  @ArrayUnique((v: UpdateVariantItemDto) => v.id, {
    message: 'Hay variantes repetidas',
  })
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantItemDto)
  variants: UpdateVariantItemDto[];
}
