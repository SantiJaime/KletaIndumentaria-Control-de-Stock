import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // El CLI (migraciones) usa el pooler en modo sesión: el modo transacción no las soporta.
  datasource: {
    // Opcional para que `prisma generate` funcione sin .env (ej. en el build de Vercel).
    url: process.env.DIRECT_URL,
  },
});
