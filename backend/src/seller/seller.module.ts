import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';

@Module({
  imports: [CommonModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class SellerModule {} 