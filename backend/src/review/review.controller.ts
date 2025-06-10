import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('products/:productId/reviews')
  @Roles('BUYER', 'ADMIN')
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
  async deleteReview(
    @CurrentUser() user: any,
    @Param('reviewId', ParseIntPipe) reviewId: number,
  ) {
    const result = await this.reviewService.deleteReview(user.id, reviewId);
    return ResponseDto.success(result, '評論刪除成功');
  }
} 