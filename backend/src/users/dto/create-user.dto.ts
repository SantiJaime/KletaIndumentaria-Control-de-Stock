import { Transform } from 'class-transformer';
import {
  IsByteLength,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

export class CreateUserDto {
  // El usuario no distingue mayúsculas: se guarda y se busca en minúsculas.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'El usuario debe ser un texto' })
  @IsNotEmpty({ message: 'Ingresá el nombre de usuario' })
  @MaxLength(50, { message: 'El usuario es demasiado largo' })
  username: string;

  // bcrypt solo mira los primeros 72 bytes: se limita en bytes (no en caracteres) para no aceptar contraseñas
  // que se truncan. Mismo mínimo que `npm run user:create`.
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsByteLength(6, 72, {
    message: 'La contraseña debe tener entre 6 y 72 caracteres',
  })
  password: string;

  @IsEnum(Role, { message: 'El rol debe ser admin o vendedor' })
  role: Role;
}
