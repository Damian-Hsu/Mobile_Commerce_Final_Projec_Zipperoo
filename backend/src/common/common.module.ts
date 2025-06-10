import { Module } from '@nestjs/common';
import { LogService } from './services/log.service';
import { ProductController } from './controllers/product.controller';

@Module({
  controllers: [ProductController],
  providers: [LogService],
  exports: [LogService],
})
export class CommonModule {} 