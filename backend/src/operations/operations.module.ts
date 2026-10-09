import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { OperationsController } from './operations.controller.js';
import { OperationsService } from './operations.service.js';

@Module({
  imports: [ProductsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
