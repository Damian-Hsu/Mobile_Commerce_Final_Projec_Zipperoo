import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@ApiTags('商品評論')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('products/:productId/reviews')
  @Roles('BUYER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '創建商品評論', description: '買家對購買的商品進行評論' })
  @ApiParam({ name: 'productId', type: 'number', description: '商品ID' })
  @ApiBody({ type: CreateReviewDto })
  @ApiResponse({ status: 201, description: '評論創建成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤或尚未購買該商品' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  @ApiResponse({ status: 409, description: '已評論過該商品' })
  async createReview(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const result = await this.reviewService.createReview(user.id, productId, createReviewDto);
    return ResponseDto.created(result, '評論創建成功');
  }

  @Public()
  @Get('products/:productId/reviews')
  @ApiOperation({ summary: '獲取商品評論', description: '獲取指定商品的所有評論' })
  @ApiParam({ name: 'productId', type: 'number', description: '商品ID' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取商品評論成功' })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async getProductReviews(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.reviewService.getProductReviews(
      productId,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取商品評論成功');
  }

  @Patch('reviews/:reviewId')
  @Roles('BUYER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新評論', description: '更新用戶自己的評論內容' })
  @ApiParam({ name: 'reviewId', type: 'number', description: '評論ID' })
  @ApiBody({ type: UpdateReviewDto })
  @ApiResponse({ status: 200, description: '評論更新成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是評論作者' })
  @ApiResponse({ status: 404, description: '評論不存在' })
  async updateReview(
    @CurrentUser() user: any,
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const result = await this.reviewService.updateReview(user.id, reviewId, updateReviewDto);
    return ResponseDto.success(result, '評論更新成功');
  }

  @Delete('reviews/:reviewId')
  @Roles('BUYER', 'ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '刪除評論', description: '刪除用戶自己的評論或管理員刪除任意評論' })
  @ApiParam({ name: 'reviewId', type: 'number', description: '評論ID' })
  @ApiResponse({ status: 200, description: '評論刪除成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或不是評論作者' })
  @ApiResponse({ status: 404, description: '評論不存在' })
  async deleteReview(
    @CurrentUser() user: any,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    const result = await this.reviewService.deleteReview(user.id, reviewId);
    return ResponseDto.success(result, '評論刪除成功');
  }
} 