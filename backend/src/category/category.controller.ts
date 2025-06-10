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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ResponseDto } from 'src/common/dto/response.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('SELLER', 'ADMIN')
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoryService.create(createCategoryDto);
    return ResponseDto.success(result, 'Category created successfully.');
  }

  @Public()
  @Get()
  async findAll() {
    const result = await this.categoryService.findAll();
    return ResponseDto.success(result);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoryService.findOne(id);
    return ResponseDto.success(result);
  }

  @Patch(':id')
  @Roles('SELLER', 'ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.categoryService.update(id, updateCategoryDto);
    return ResponseDto.success(result, 'Category updated successfully.');
  }

  @Delete(':id')
  @Roles('SELLER', 'ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.remove(id);
    return ResponseDto.success(null, 'Category deleted successfully.');
  }
} 