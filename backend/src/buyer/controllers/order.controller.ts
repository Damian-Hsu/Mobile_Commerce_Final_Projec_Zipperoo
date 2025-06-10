import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CheckoutDto } from '../dto/checkout.dto';

@Controller('buyers/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user: any, @Body() checkoutDto: CheckoutDto) {
    const result = await this.orderService.checkout(user.id, checkoutDto.cartItemIds);
    return ResponseDto.created(result, '結帳成功');
  }

  @Get('orders')
  async getOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.orderService.getOrders(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Get('orders/:orderId')
  async getOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.orderService.getOrder(user.id, orderId);
    return ResponseDto.success(result, '獲取訂單詳情成功');
  }

  @Patch('orders/:orderId/cancel')
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.orderService.cancelOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已取消');
  }
} 