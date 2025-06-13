import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../common/services/log.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async createReview(buyerId: number, productId: number, createReviewDto: CreateReviewDto) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    // Check if buyer has completed order for this product
    const completedOrder = await this.prisma.order.findFirst({
      where: {
        buyerId,
        status: 'COMPLETED',
        items: {
          some: {
            productVariant: {
              productId: productId,
            },
          },
        },
      },
    });

    if (!completedOrder) {
      throw new BadRequestException('只能對已完成訂單的商品進行評論');
    }

    // Check if review already exists for this product by this buyer
    const existingReview = await this.prisma.review.findFirst({
      where: { 
        productId: productId,
        buyerId: buyerId,
        isDeleted: false
      },
    });

    if (existingReview) {
      throw new BadRequestException('您已經評價過此商品');
    }

    const review = await this.prisma.review.create({
      data: {
        productId,
        orderId: completedOrder.id,
        buyerId,
        score: createReviewDto.score,
        comment: createReviewDto.comment,
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.logService.record(
      'REVIEW_CREATED', 
      buyerId, 
      `創建商品評論`,
      undefined, // ipAddress
      {
        reviewId: review.id,
        productId,
        orderId: completedOrder.id,
        score: createReviewDto.score,
      }
    );

    return review;
  }

  async getProductReviews(productId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          productId,
          isDeleted: false,
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.review.count({
        where: {
          productId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async updateReview(buyerId: number, reviewId: number, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        buyerId,
        isDeleted: false,
      },
    });

    if (!review) {
      throw new NotFoundException('評論不存在');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        score: updateReviewDto.score,
        comment: updateReviewDto.comment,
        isEdited: true,
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.logService.record(
      'REVIEW_UPDATED', 
      buyerId, 
      `更新商品評論`,
      undefined, // ipAddress
      {
        reviewId,
        changes: updateReviewDto,
      }
    );

    return updatedReview;
  }

  async deleteReview(buyerId: number, reviewId: number) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        buyerId,
        isDeleted: false,
      },
    });

    if (!review) {
      throw new NotFoundException('評論不存在');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { isDeleted: true },
    });

    await this.logService.record(
      'REVIEW_DELETED', 
      buyerId, 
      `刪除商品評論`,
      undefined, // ipAddress
      {
        reviewId,
        productId: review.productId,
      }
    );

    return { message: '評論已刪除' };
  }
} 