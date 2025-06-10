import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseDto } from '../dto/response.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';
import { Public } from '../decorators/public.decorator';

@Controller()
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('products')
  async getProducts(@Query() query: GetProductsQueryDto) {
    const { page, pageSize, search, categoryId, minPrice, maxPrice, sortBy, sortOrder } = query;
    const skip = ((page || 1) - 1) * (pageSize || 10);

    const where: any = {
      status: 'ON_SHELF',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: true,
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
              shopName: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize || 10,
      }),
      this.prisma.product.count({ where }),
    ]);

    return ResponseDto.success({
      data: products,
      meta: {
        page: page || 1,
        pageSize: pageSize || 10,
        total,
        totalPages: Math.ceil(total / (pageSize || 10)),
      },
    }, '獲取商品列表成功');
  }

  @Public()
  @Get('products/:id')
  async getProduct(@Param('id', ParseIntPipe) productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ON_SHELF',
      },
      include: {
        images: true,
        category: true,
        seller: {
          select: {
            id: true,
            username: true,
            shopName: true,
            description: true,
          },
        },
        reviews: {
          where: { isDeleted: false },
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            reviews: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!product) {
      return ResponseDto.error('商品不存在', 404);
    }

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: {
        productId,
        isDeleted: false,
      },
      _avg: {
        score: true,
      },
    });

    return ResponseDto.success({
      ...product,
      avgRating: avgRating._avg.score || 0,
    }, '獲取商品詳情成功');
  }

  @Public()
  @Get('categories')
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ON_SHELF' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return ResponseDto.success(categories, '獲取分類列表成功');
  }

  @Public()
  @Get('categories/:id/products')
  async getCategoryProducts(
    @Param('id', ParseIntPipe) categoryId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const skip = ((paginationDto.page || 1) - 1) * (paginationDto.pageSize || 10);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          categoryId,
          status: 'ON_SHELF',
        },
        include: {
          images: true,
          category: true,
          seller: {
            select: {
              id: true,
              username: true,
              shopName: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: paginationDto.pageSize || 10,
      }),
      this.prisma.product.count({
        where: {
          categoryId,
          status: 'ON_SHELF',
        },
      }),
    ]);

    return ResponseDto.success({
      data: products,
      meta: {
        page: paginationDto.page || 1,
        pageSize: paginationDto.pageSize || 10,
        total,
        totalPages: Math.ceil(total / (paginationDto.pageSize || 10)),
      },
    }, '獲取分類商品成功');
  }
} 