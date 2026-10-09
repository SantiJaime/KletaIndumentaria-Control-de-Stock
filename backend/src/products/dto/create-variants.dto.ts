import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateVariantDto } from './create-variant.dto.js';

export class CreateVariantsDto {
  @IsArray({ message: 'Las variantes deben ser una lista' })
  @ArrayMinSize(1, { message: 'Agregá al menos una variante' })
  // No permite dos variantes con el mismo talle y color (sin distinguir mayúsculas).
  @ArrayUnique(
    (v: CreateVariantDto) =>
      `${v.size?.toLowerCase()}|${v.color?.toLowerCase()}`,
    { message: 'Hay variantes con el mismo talle y color' },
  )
  // Valida cada elemento con las reglas de CreateVariantDto. Requiere @Type para que
  // class-transformer instancie la clase (y `transform: true` en el ValidationPipe).
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
