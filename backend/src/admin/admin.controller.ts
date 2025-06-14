import { Controller, Get, Delete, Patch, Param, Query, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { LogsQueryDto } from './dto/logs-query.dto';

@ApiTags('系統管理')
@Controller('admin')
@Roles('ADMIN')
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  
  @Delete('users/:userId')
  @ApiOperation({ summary: '刪除用戶', description: '管理員刪除指定用戶' })
  @ApiParam({ name: 'userId', type: 'number', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶已刪除' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '用戶不存在' })
  async deleteUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.deleteUser(user.id, userId);
    return ResponseDto.success(result, '用戶已刪除');
  }

  @Patch('users/:userId/block')
  @ApiOperation({ summary: '封鎖用戶', description: '管理員封鎖指定用戶' })
  @ApiParam({ name: 'userId', type: 'number', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶已封鎖' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '用戶不存在' })
  async blockUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.blockUser(user.id, userId);
    return ResponseDto.success(result, '用戶已封鎖');
  }

  @Patch('users/:userId/unblock')
  @ApiOperation({ summary: '解除封鎖用戶', description: '管理員解除指定用戶的封鎖' })
  @ApiParam({ name: 'userId', type: 'number', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶已解除封鎖' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '用戶不存在' })
  async unblockUser(
    @CurrentUser() user: any,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const result = await this.adminService.unblockUser(user.id, userId);
    return ResponseDto.success(result, '用戶已解除封鎖');
  }

  @Delete('products/:productId')
  @ApiOperation({ summary: '刪除商品', description: '管理員刪除指定商品' })
  @ApiParam({ name: 'productId', type: 'number', description: '商品ID' })
  @ApiResponse({ status: 200, description: '商品已刪除' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async deleteProduct(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const result = await this.adminService.deleteProduct(user.id, productId);
    return ResponseDto.success(result, '商品已刪除');
  }

  @Get('logs')
  @ApiOperation({ summary: '獲取系統日誌', description: '管理員獲取系統操作日誌' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiQuery({ name: 'search', type: 'string', required: false, description: '搜尋關鍵字' })
  @ApiQuery({ name: 'event', type: 'string', required: false, description: '事件類型' })
  @ApiQuery({ name: 'username', type: 'string', required: false, description: '用戶名' })
  @ApiQuery({ name: 'ip', type: 'string', required: false, description: 'IP地址' })
  @ApiQuery({ name: 'startDate', type: 'string', required: false, description: '開始日期' })
  @ApiQuery({ name: 'endDate', type: 'string', required: false, description: '結束日期' })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false, description: '排序方式：id, createdAt, -id, -createdAt' })
  @ApiResponse({ status: 200, description: '獲取日誌成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getLogs(@Query() logsQuery: LogsQueryDto) {
    const result = await this.adminService.getLogs(logsQuery);
    return ResponseDto.success(result, '獲取日誌成功');
  }

  @Get('users')
  @ApiOperation({ summary: '獲取用戶列表', description: '管理員獲取所有用戶列表' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取用戶列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getUsers(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getUsers(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取用戶列表成功');
  }

  @Get('products')
  @ApiOperation({ summary: '獲取商品列表', description: '管理員獲取所有商品列表' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取商品列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getProducts(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getProducts(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取商品列表成功');
  }

  @Get('orders')
  @ApiOperation({ summary: '獲取訂單列表', description: '管理員獲取所有訂單列表' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取訂單列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getOrders(@Query() paginationDto: PaginationDto) {
    const result = await this.adminService.getOrders(
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '獲取訂單詳情', description: '管理員獲取指定訂單詳情' })
  @ApiParam({ name: 'id', type: 'number', description: '訂單ID' })
  @ApiResponse({ status: 200, description: '獲取訂單詳情成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async getOrder(@Param('id', ParseIntPipe) id: number) {
    const result = await this.adminService.getOrder(id);
    return ResponseDto.success(result, '獲取訂單詳情成功');
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: '更新訂單狀態', description: '管理員更新指定訂單的狀態' })
  @ApiParam({ name: 'id', type: 'number', description: '訂單ID' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: '訂單狀態更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const result = await this.adminService.updateOrderStatus(id, updateOrderStatusDto.status, user.id);
    return ResponseDto.success(result, '訂單狀態更新成功');
  }

  @Patch('products/:id')
  @ApiOperation({ summary: '更新商品', description: '管理員更新指定商品的信息' })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiResponse({ status: 200, description: '商品更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    const result = await this.adminService.updateProduct(user.id, id, updateData);
    return ResponseDto.success(result, '商品更新成功');
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: '更新商品狀態', description: '管理員更新指定商品的狀態' })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiBody({ type: UpdateProductStatusDto })
  @ApiResponse({ status: 200, description: '商品狀態更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async updateProductStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
  ) {
    const result = await this.adminService.updateProductStatus(user.id, id, updateProductStatusDto.status);
    return ResponseDto.success(result, '商品狀態更新成功');
  }
} 