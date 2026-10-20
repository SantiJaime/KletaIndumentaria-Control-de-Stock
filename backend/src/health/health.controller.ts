import { timingSafeEqual } from 'node:crypto';
import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Compara sin cortar en el primer caracter distinto, para no dar pistas del secreto por el tiempo de respuesta. */
const sameSecret = (received: string, expected: string) => {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // La llama una vez por día el cron de Vercel (ver `vercel.json`): la consulta cuenta como actividad y evita que
  // Supabase pause el proyecto del plan gratuito cuando el sistema no se usa. Pública porque el cron no tiene
  // sesión; si está definido CRON_SECRET (Vercel lo manda como `Authorization: Bearer ...`), lo exige.
  @Public()
  @Get()
  async check(@Headers('authorization') authorization?: string) {
    const secret = this.config.get<string>('CRON_SECRET');
    if (secret && !sameSecret(authorization ?? '', `Bearer ${secret}`)) {
      throw new UnauthorizedException();
    }
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}
