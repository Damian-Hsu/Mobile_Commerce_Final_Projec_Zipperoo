import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../common/services/log.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async createProduct(sellerId: number, createProductDto: CreateProductDto) {
    const { variants, imageUrls, ...productData } = createProductDto;

    return await this.prisma.$transaction(async (tx: any) => {
      const product = await tx.product.create({
        data: {
          sellerId,
          ...productData,
          status: 'ON_SHELF',
        },
      });

      // Create product variants if provided
      if (variants && variants.length > 0) {
        const variantsData = variants.map((variant) => ({
          ...variant,
          productId: product.id,
        }));
        await tx.productVariant.createMany({
          data: variantsData,
        });
      }

      // Create product images if provided
      if (imageUrls && imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: imageUrls.map((url: string) => ({
            productId: product.id,
            url,
          })),
        });
      }

      await this.logService.record('PRODUCT_CREATED', sellerId, {
        productId: product.id,
        productName: product.name,
      });

      return await tx.product.findUnique({
        where: { id: product.id },
        include: {
          images: true,
          category: true,
          variants: true,
        },
      });
    });
  }

  async getProducts(sellerId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { 
          sellerId,
          status: { not: 'DELETED' },
        },
        include: {
          images: true,
          category: true,
          variants: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({
        where: { 
          sellerId,
          status: { not: 'DELETED' },
        },
      }),
    ]);

    return {
      data: products,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getProduct(sellerId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
      include: {
        images: true,
        category: true,
        variants: true,
        reviews: {
          include: {
            buyer: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          where: {
            isDeleted: false,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    return product;
  }

  async updateProduct(sellerId: number, productId: number, updateProductDto: UpdateProductDto) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('商品不存在');
    }

    const { price, stock, ...productData } = updateProductDto;

    return await this.prisma.$transaction(async (tx: any) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...productData,
        },
      });

      // Update images if provided
      if (updateProductDto.imageUrls) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId },
        });

        // Create new images
        if (updateProductDto.imageUrls.length > 0) {
          await tx.productImage.createMany({
            data: updateProductDto.imageUrls.map((url: string) => ({
              productId,
              url,
            })),
          });
        }
      }

      await this.logService.record('PRODUCT_UPDATED', sellerId, {
        productId,
        changes: updateProductDto,
      });

      return await tx.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          category: true,
        },
      });
    });
  }

  async deleteProduct(sellerId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId,
        status: { not: 'DELETED' },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DELETED' },
    });

    await this.logService.record('PRODUCT_DELETED', sellerId, {
      productId,
      productName: product.name,
    });

    return { message: '商品已刪除' };
  }

  async getOrders(sellerId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerId },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
              account: true,
            },
          },
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    include: {
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({
        where: { sellerId },
      }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async shipOrder(sellerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId,
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (order.status !== 'UNCOMPLETED') {
      throw new ForbiddenException('只能出貨未完成的訂單');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    await this.logService.record('ORDER_SHIPPED', sellerId, {
      orderId,
    });

    return { message: '訂單已出貨' };
  }

  async completeOrder(sellerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId,
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }

    if (order.status === 'CANCELED') {
      throw new ForbiddenException('已取消的訂單無法完成');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    await this.logService.record('ORDER_COMPLETED', sellerId, {
      orderId,
    });

    return { message: '訂單已完成' };
  }
} 