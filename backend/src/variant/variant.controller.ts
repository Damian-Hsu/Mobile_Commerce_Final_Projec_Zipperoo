import { Controller, Post, Body, Param, Put, Delete, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { VariantService } from './variant.service';
import { CreateVariantsDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';

@ApiTags('商品款式管理')
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER', 'ADMIN')
@ApiBearerAuth('JWT-auth')
export class VariantController {
  constructor(private readonly variantService: VariantService) {}

  @Post('products/:productId/variants')
  @ApiOperation({ summary: '新增商品款式', description: '為指定商品新增款式選項（如尺寸、顏色等）' })
  @ApiParam({ name: 'productId', type: 'number', description: '商品ID' })
  @ApiBody({ type: CreateVariantsDto })
  @ApiResponse({ status: 201, description: '商品款式新增成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是商品擁有者' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async addVariants(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createVariantsDto: CreateVariantsDto,
  ) {
    const result = await this.variantService.addVariants(user.id, productId, createVariantsDto);
    return ResponseDto.created(result, '商品款式新增成功');
  }

  @Put('variants/:variantId')
  @ApiOperation({ summary: '更新商品款式', description: '更新指定商品款式的資訊' })
  @ApiParam({ name: 'variantId', type: 'number', description: '款式ID' })
  @ApiBody({ type: UpdateVariantDto })
  @ApiResponse({ status: 200, description: '商品款式更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是款式擁有者' })
  @ApiResponse({ status: 404, description: '款式不存在' })
  async updateVariant(
    @CurrentUser() user: any,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() updateVariantDto: UpdateVariantDto,
  ) {
    const result = await this.variantService.updateVariant(user.id, variantId, updateVariantDto);
    return ResponseDto.success(result, '商品款式更新成功');
  }

  @Delete('variants/:variantId')
  @ApiOperation({ summary: '刪除商品款式', description: '刪除指定的商品款式' })
  @ApiParam({ name: 'variantId', type: 'number', description: '款式ID' })
  @ApiResponse({ status: 200, description: '商品款式已成功刪除' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是款式擁有者' })
  @ApiResponse({ status: 404, description: '款式不存在' })
  async deleteVariant(
    @CurrentUser() user: any, 
    @Param('variantId', ParseIntPipe) variantId: number
  ) {
    const result = await this.variantService.deleteVariant(user.id, variantId);
    return ResponseDto.success(result, '商品款式已成功刪除');
  }
} 