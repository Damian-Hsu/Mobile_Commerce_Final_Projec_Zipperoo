import { Controller, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { VariantService } from './variant.service';
import { CreateVariantsDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post('products/:productId/variants')
  async addVariants(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createVariantsDto: CreateVariantsDto,
  ) {
    const result = await this.variantService.addVariants(user.id, productId, createVariantsDto);
    return ResponseDto.created(result, '商品款式新增成功');
  }

  @Put('variants/:variantId')
  async updateVariant(
    @CurrentUser() user: any,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    const result = await this.variantService.updateVariant(user.id, variantId, updateVariantDto);
    return ResponseDto.success(result, '商品款式更新成功');
  }

  @Delete('variants/:variantId')
  async deleteVariant(
    @CurrentUser() user: any, 
    @Param('variantId', ParseIntPipe) variantId: number
  ) {
    const result = await this.variantService.deleteVariant(user.id, variantId);
    return ResponseDto.success(result, '商品款式已成功刪除');
  }
} 