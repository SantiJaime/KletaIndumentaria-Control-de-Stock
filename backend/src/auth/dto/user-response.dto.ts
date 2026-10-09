import type { Role, User } from '../../generated/prisma/client.js';

// Forma en que la API devuelve un usuario: nunca incluye el hash de la contraseña.
export class UserResponseDto {
  id: number;
  username: string;
  role: Role;

  constructor(user: Pick<User, 'id' | 'username' | 'role'>) {
    this.id = user.id;
    this.username = user.username;
    this.role = user.role;
  }
}
