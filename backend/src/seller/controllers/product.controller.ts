import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@ApiTags('賣家商品管理')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
@ApiBearerAuth('JWT-auth')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  @ApiOperation({ summary: '獲取賣家商品列表', description: '獲取當前賣家的所有商品列表' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiQuery({ name: 'search', type: 'string', required: false, description: '搜尋關鍵字' })
  @ApiResponse({ status: 200, description: '獲取商品列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getSellerProducts(@CurrentUser() user: any, @Query() paginationDto: PaginationDto, @Query('search') search?: string) {
    console.log('🔍 控制器收到搜尋參數:', search);
    console.log('🔍 分頁參數:', paginationDto);
    const result = await this.productService.getProducts(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
      search,
    );
    return ResponseDto.success(result, '獲取商品列表成功');
  }

  @Get('products/:id')
  @ApiOperation({ summary: '獲取單個商品', description: '獲取賣家的指定商品詳情' })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiResponse({ status: 200, description: '獲取商品成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async getProduct(@CurrentUser() user: any, @Param('id', ParseIntPipe) productId: number) {
    const result = await this.productService.getProduct(user.id, productId);
    return ResponseDto.success(result, '獲取商品成功');
  }

  @Post('products')
  @ApiOperation({ summary: '創建商品', description: '賣家創建新商品' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: '商品創建成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async createProduct(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    const result = await this.productService.createProduct(user.id, createProductDto);
    return ResponseDto.created(result, '商品創建成功');
  }

  @Patch('products/:id')
  @ApiOperation({ summary: '更新商品', description: '更新指定商品的資訊' })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: '商品更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productService.updateProduct(user.id, productId, updateProductDto);
    return ResponseDto.success(result, '商品更新成功');
  }

  @Delete('products/:id')
  @ApiOperation({ summary: '刪除商品', description: '刪除指定的商品' })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiResponse({ status: 200, description: '商品刪除成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async deleteProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    const result = await this.productService.deleteProduct(user.id, productId);
    return ResponseDto.success(result, '商品刪除成功');
  }

  @Get('orders')
  @ApiOperation({ summary: '獲取訂單列表', description: '獲取賣家相關的所有訂單' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取訂單列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.productService.getOrders(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Patch('orders/:orderId/ship')
  @ApiOperation({ summary: '訂單出貨', description: '將訂單狀態更新為已出貨' })
  @ApiParam({ name: 'orderId', type: 'number', description: '訂單ID' })
  @ApiResponse({ status: 200, description: '訂單已出貨' })
  @ApiResponse({ status: 400, description: '訂單狀態不允許出貨' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async shipOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.productService.shipOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已出貨');
  }

  @Patch('orders/:orderId/complete')
  @ApiOperation({ summary: '完成訂單', description: '將訂單狀態更新為已完成' })
  @ApiParam({ name: 'orderId', type: 'number', description: '訂單ID' })
  @ApiResponse({ status: 200, description: '訂單已完成' })
  @ApiResponse({ status: 400, description: '訂單狀態不允許完成' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async completeOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.productService.completeOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已完成');
  }
} 