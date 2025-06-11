import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ResponseDto } from '../dto/response.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';
import { Public } from '../decorators/public.decorator';

@ApiTags('公開商品瀏覽')
@Controller()
export class ProductController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('products')
  @ApiOperation({ 
    summary: '獲取商品列表', 
    description: '獲取所有上架商品列表，支援搜尋、分類篩選、價格篩選和排序' 
  })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼，預設為1' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量，預設為10' })
  @ApiQuery({ name: 'search', type: 'string', required: false, description: '搜尋關鍵字（商品名稱或描述）' })
  @ApiQuery({ name: 'categoryId', type: 'number', required: false, description: '分類ID' })
  @ApiQuery({ name: 'minPrice', type: 'number', required: false, description: '最低價格' })
  @ApiQuery({ name: 'maxPrice', type: 'number', required: false, description: '最高價格' })
  @ApiQuery({ name: 'sortBy', type: 'string', required: false, description: '排序欄位', enum: ['createdAt', 'name'] })
  @ApiQuery({ name: 'sortOrder', type: 'string', required: false, description: '排序方向', enum: ['asc', 'desc'] })
  @ApiResponse({ 
    status: 200, 
    description: '獲取商品列表成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '獲取商品列表成功' },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'number' },
                  category: { type: 'object' },
                  seller: { type: 'object' },
                  images: { type: 'array' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                pageSize: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
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

    let orderBy: any = { createdAt: sortOrder || 'desc' };
    
    if (sortBy === 'name') {
      orderBy = { name: sortOrder || 'asc' };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder || 'desc' };
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
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              attributes: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize || 10,
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithPrice = products.map(product => ({
      ...product,
      minPrice: product.variants.length > 0 
        ? Math.min(...product.variants.map(v => v.price))
        : null,
      maxPrice: product.variants.length > 0 
        ? Math.max(...product.variants.map(v => v.price))
        : null,
    }));

    return ResponseDto.success({
      data: productsWithPrice,
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
  @ApiOperation({ 
    summary: '獲取商品詳情', 
    description: '獲取指定商品的詳細資訊，包含評論和平均評分' 
  })
  @ApiParam({ name: 'id', type: 'number', description: '商品ID' })
  @ApiResponse({ 
    status: 200, 
    description: '獲取商品詳情成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '獲取商品詳情成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            avgRating: { type: 'number' },
            category: { type: 'object' },
            seller: { type: 'object' },
            images: { type: 'array' },
            reviews: { type: 'array' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '商品不存在' })
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
  @ApiOperation({ 
    summary: '獲取商品分類列表', 
    description: '獲取所有商品分類及每個分類的商品數量' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '獲取分類列表成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '獲取分類列表成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              _count: {
                type: 'object',
                properties: {
                  products: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  })
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
  @ApiOperation({ 
    summary: '獲取分類商品', 
    description: '獲取指定分類下的所有商品' 
  })
  @ApiParam({ name: 'id', type: 'number', description: '分類ID' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ 
    status: 200, 
    description: '獲取分類商品成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '獲取分類商品成功' },
        data: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                pageSize: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '分類不存在' })
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