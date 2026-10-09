import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    // La app usa el pooler de Supabase (modo transacción), apto para serverless.
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      // Serverless: pocas conexiones por instancia (el pooler de Supabase ya reparte) y un tope de espera
      // para conectar, así una DB inalcanzable da error en los logs en vez de dejar el pedido colgado.
      max: 5,
      connectionTimeoutMillis: 8_000,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
