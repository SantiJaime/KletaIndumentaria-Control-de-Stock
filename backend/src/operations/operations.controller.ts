import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import type { AccessTokenPayload } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OperationType, Role } from '../generated/prisma/enums.js';
import { CreateOperationDto } from './dto/create-operation.dto.js';
import { TotalOperationsQueryDto } from './dto/total-operations-query.dto.js';
import { ListOperationsQueryDto } from './dto/list-operations-query.dto.js';
import { OperationsService } from './operations.service.js';

@Controller('operations')
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  // El historial y los montos son solo para administradores.
  @Roles(Role.admin)
  @Get()
  findAll(@Query() query: ListOperationsQueryDto) {
    return this.operationsService.findAll(query);
  }

  // Monto total y cantidad de un tipo de operación en un rango de fechas.
  @Roles(Role.admin)
  @Get('total')
  getTotal(@Query() query: TotalOperationsQueryDto) {
    return this.operationsService.getTotal(query);
  }

  @Post()
  create(
    @Body() createOperationDto: CreateOperationDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    // El vendedor solo puede registrar ventas; las compras son del administrador.
    if (
      user.role !== Role.admin &&
      createOperationDto.type === OperationType.compra
    ) {
      throw new ForbiddenException(
        'Solo un administrador puede registrar compras',
      );
    }
    return this.operationsService.create(createOperationDto);
  }
}
