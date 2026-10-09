import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // El usuario no distingue mayúsculas: se guarda y se busca en minúsculas.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'El usuario debe ser un texto' })
  @IsNotEmpty({ message: 'Ingresá tu nombre de usuario' })
  @MaxLength(50, { message: 'El usuario es demasiado largo' })
  username: string;

  // bcrypt solo mira los primeros 72 bytes: se limita para no aceptar contraseñas que se truncan.
  @IsString({ message: 'La contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'Ingresá tu contraseña' })
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  password: string;
}
