import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@Controller('buyers/me/cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: any) {
    const result = await this.cartService.getCart(user.id);
    return ResponseDto.success(result, '獲取購物車成功');
  }

  @Post('items')
  async addItem(@CurrentUser() user: any, @Body() addCartItemDto: AddCartItemDto) {
    const result = await this.cartService.addItem(user.id, addCartItemDto);
    return ResponseDto.created(result, '商品已加入購物車');
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const result = await this.cartService.updateItem(user.id, itemId, updateCartItemDto);
    return ResponseDto.success(result, '購物車項目已更新');
  }

  @Delete('items/:itemId')
  async removeItem(
    @CurrentUser() user: any,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    const result = await this.cartService.removeItem(user.id, itemId);
    return ResponseDto.success(result, '項目已移除');
  }
} 