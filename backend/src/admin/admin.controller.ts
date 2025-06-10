import { Controller, Get, Delete, Patch, Param, Query, ParseIntPipe, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('users/:userId')
  async deleteUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.deleteUser(user.id, userId);
    return ResponseDto.success(result, '用戶已刪除');
  }

  @Patch('users/:userId/block')
  async blockUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.blockUser(user.id, userId);
    return ResponseDto.success(result, '用戶已封鎖');
  }

  @Patch('users/:userId/unblock')
  async unblockUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.unblockUser(user.id, userId);
    return ResponseDto.success(result, '用戶已解除封鎖');
  }

  @Delete('products/:productId')
  async deleteProduct(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const result = await this.adminService.deleteProduct(user.id, productId);
    return ResponseDto.success(result, '商品已刪除');
  }

  @Get('logs')
  async getLogs(@Query() query: any, @Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getLogs(
      query,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取日誌成功');
  }

  @Get('users')
  async getUsers(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getUsers(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取用戶列表成功');
  }

  @Get('products')
  async getProducts(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getProducts(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取商品列表成功');
  }

  @Get('orders')
  async getOrders(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getOrders(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Get('orders/:id')
  async getOrder(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getOrder(id);
    return ResponseDto.success(result, '獲取訂單詳情成功');
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const result = await this.adminService.updateOrderStatus(id, updateOrderStatusDto.status, user.id);
    return ResponseDto.success(result, '訂單狀態更新成功');
  }
} 