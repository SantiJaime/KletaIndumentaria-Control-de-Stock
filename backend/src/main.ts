import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
