import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { AuthService } from '../auth/auth.service.js';
import { UserResponseDto } from '../auth/dto/user-response.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /** Crea un usuario nuevo (no modifica existentes: para eso está `npm run user:create`). */
  async create({
    username,
    password,
    role,
  }: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.create({
        data: {
          username,
          passwordHash: await this.authService.hashPassword(password),
          role,
        },
      });
      return new UserResponseDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Ya existe el usuario ${username}`);
      }
      throw error;
    }
  }
}
