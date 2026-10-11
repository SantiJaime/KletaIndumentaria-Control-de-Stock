import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // En Vercel la app queda detrás de su proxy: la IP real del cliente llega en `X-Forwarded-For` (Vercel lo
  // pisa, no se puede falsear). Hace falta para limitar los intentos de inicio de sesión por IP.
  if (process.env.VERCEL) app.set('trust proxy', true);
  // Cabeceras de seguridad (nosniff, sin `X-Powered-By`, etc.).
  app.use(helmet());
  // Necesario solo si el front llama directo a la API desde otro origen (VITE_API_URL).
  // `credentials: true` permite enviar y recibir las cookies de sesión.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173',
    credentials: true,
  });
  // Todas las rutas cuelgan de /api. En Vercel la API recibe la URL original (/api/...) y el proxy de Vite
  // tampoco le saca el prefijo, así que en desarrollo y en producción las URLs son las mismas.
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // y responde 400 si llegan
      transform: true, // convierte el body en instancia del DTO (necesario para @ValidateNested)
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
// Sin `await` a nivel de módulo: en Vercel `listen` queda capturado por el launcher y su promesa no se resuelve,
// así que esperar a `bootstrap()` dejaría el import colgado (el sitio responde 500 a los 60 s).
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
