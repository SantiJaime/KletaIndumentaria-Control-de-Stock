import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

@Module({
  // Los secretos se pasan en cada firma/verificación: el access y el refresh token usan secretos distintos.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    // El orden importa: primero se autentica (`request.user`) y después se revisan los roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
