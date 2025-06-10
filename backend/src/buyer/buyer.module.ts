import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { CartService } from './services/cart.service';
import { OrderService } from './services/order.service';

@Module({
  imports: [CommonModule],
  controllers: [CartController, OrderController],
  providers: [CartService, OrderService],
  exports: [CartService, OrderService],
})
export class BuyerModule {} 