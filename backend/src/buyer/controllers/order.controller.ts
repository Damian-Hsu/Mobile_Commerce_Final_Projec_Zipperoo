import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CheckoutDto } from '../dto/checkout.dto';

@ApiTags('買家訂單管理')
@Controller('buyers/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @ApiOperation({ summary: '結帳', description: '將購物車中的商品進行結帳，創建訂單' })
  @ApiBody({ type: CheckoutDto })
  @ApiResponse({ status: 201, description: '結帳成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤或購物車為空' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '購物車項目不存在' })
  async checkout(@CurrentUser() user: any, @Body() checkoutDto: CheckoutDto) {
    const result = await this.orderService.checkout(user.id, checkoutDto.cartItemIds);
    return ResponseDto.created(result, '結帳成功');
  }

  @Get('orders')
  @ApiOperation({ summary: '獲取訂單列表', description: '獲取當前用戶的所有訂單列表' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取訂單列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.orderService.getOrders(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: '獲取訂單詳情', description: '獲取指定訂單的詳細資訊' })
  @ApiParam({ name: 'orderId', type: 'number', description: '訂單ID' })
  @ApiResponse({ status: 200, description: '獲取訂單詳情成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async getOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.orderService.getOrder(user.id, orderId);
    return ResponseDto.success(result, '獲取訂單詳情成功');
  }

  @Patch('orders/:orderId/cancel')
  @ApiOperation({ summary: '取消訂單', description: '取消指定的訂單（僅限未處理狀態）' })
  @ApiParam({ name: 'orderId', type: 'number', description: '訂單ID' })
  @ApiResponse({ status: 200, description: '訂單已取消' })
  @ApiResponse({ status: 400, description: '訂單狀態不允許取消' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.orderService.cancelOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已取消');
  }
} 