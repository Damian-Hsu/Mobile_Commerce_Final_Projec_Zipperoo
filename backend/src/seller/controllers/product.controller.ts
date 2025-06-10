import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('products')
  async getProducts(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.productService.getProducts(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取商品列表成功');
  }

  @Post('products')
  async createProduct(@CurrentUser() user: any, @Body() createProductDto: CreateProductDto) {
    const result = await this.productService.createProduct(user.id, createProductDto);
    return ResponseDto.created(result, '商品創建成功');
  }

  @Get('products/:id')
  async getProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    const result = await this.productService.getProduct(user.id, productId);
    return ResponseDto.success(result, '獲取商品詳情成功');
  }

  @Put('products/:id')
  async updateProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) productId: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productService.updateProduct(user.id, productId, updateProductDto);
    return ResponseDto.success(result, '商品更新成功');
  }

  @Delete('products/:id')
  async deleteProduct(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) productId: number,
  ) {
    const result = await this.productService.deleteProduct(user.id, productId);
    return ResponseDto.success(result, '商品刪除成功');
  }

  @Get('orders')
  async getOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.productService.getOrders(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訂單列表成功');
  }

  @Patch('orders/:orderId/ship')
  async shipOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.productService.shipOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已出貨');
  }

  @Patch('orders/:orderId/complete')
  async completeOrder(
    @CurrentUser() user: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    const result = await this.productService.completeOrder(user.id, orderId);
    return ResponseDto.success(result, '訂單已完成');
  }
} 