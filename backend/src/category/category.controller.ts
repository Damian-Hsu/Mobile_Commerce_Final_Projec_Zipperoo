import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ResponseDto } from 'src/common/dto/response.dto';

@ApiTags('商品分類管理')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '創建商品分類', description: '創建新的商品分類（僅限賣家和管理員）' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: '分類創建成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createCategoryDto);
    return ResponseDto.success(result, 'Category created successfully.');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '獲取所有分類', description: '獲取所有商品分類列表' })
  @ApiResponse({ status: 200, description: '獲取分類列表成功' })
  async findAll() {
    const result = await this.categoryService.findAll();
    return ResponseDto.success(result);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '獲取單個分類', description: '根據ID獲取指定商品分類' })
  @ApiParam({ name: 'id', type: 'number', description: '分類ID' })
  @ApiResponse({ status: 200, description: '獲取分類成功' })
  @ApiResponse({ status: 404, description: '分類不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.findOne(id);
    return ResponseDto.success(result);
  }

  @Patch(':id')
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新分類', description: '更新指定商品分類（僅限賣家和管理員）' })
  @ApiParam({ name: 'id', type: 'number', description: '分類ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: '分類更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '分類不存在' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.categoryService.update(id, updateCategoryDto);
    return ResponseDto.success(result, 'Category updated successfully.');
  }

  @Delete(':id')
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '刪除分類', description: '刪除指定商品分類（僅限賣家和管理員）' })
  @ApiParam({ name: 'id', type: 'number', description: '分類ID' })
  @ApiResponse({ status: 200, description: '分類刪除成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '分類不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return ResponseDto.success(null, 'Category deleted successfully.');
  }
} 