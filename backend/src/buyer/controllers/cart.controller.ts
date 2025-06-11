import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@ApiTags('購物車管理')
@Controller('buyers/me/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '獲取購物車', description: '獲取當前用戶的購物車內容' })
  @ApiResponse({ status: 200, description: '獲取購物車成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getCart(@CurrentUser() user: any) {
    const result = await this.cartService.getCart(user.id);
    return ResponseDto.success(result, '獲取購物車成功');
  }

  @Post('items')
  @ApiOperation({ summary: '添加商品到購物車', description: '將商品添加到購物車中' })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({ status: 201, description: '商品已加入購物車' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async addItem(@CurrentUser() user: any, @Body() addCartItemDto: AddCartItemDto) {
    const result = await this.cartService.addItem(user.id, addCartItemDto);
    return ResponseDto.created(result, '商品已加入購物車');
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: '更新購物車項目', description: '更新購物車中指定項目的數量或其他屬性' })
  @ApiParam({ name: 'itemId', type: 'number', description: '購物車項目ID' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({ status: 200, description: '購物車項目已更新' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '購物車項目不存在' })
  async updateItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const result = await this.cartService.updateItem(user.id, itemId, updateCartItemDto);
    return ResponseDto.success(result, '購物車項目已更新');
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: '移除購物車項目', description: '從購物車中移除指定項目' })
  @ApiParam({ name: 'itemId', type: 'number', description: '購物車項目ID' })
  @ApiResponse({ status: 200, description: '項目已移除' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '購物車項目不存在' })
  async removeItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    const result = await this.cartService.removeItem(user.id, itemId);
    return ResponseDto.success(result, '項目已移除');
  }
} 