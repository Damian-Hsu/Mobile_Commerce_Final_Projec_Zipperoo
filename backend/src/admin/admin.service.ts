import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../common/services/log.service';

type OrderStatus = 'UNCOMPLETED' | 'COMPLETED' | 'CANCELED';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async deleteUser(adminId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用戶不存在');
    }

    // Soft delete by blocking the user
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    await this.logService.record(
      'USER_DELETED_BY_ADMIN', 
      adminId, 
      `管理員刪除用戶 ${user.account}`,
      undefined, // ipAddress
      {
        deletedUserId: userId,
        deletedUserAccount: user.account,
      }
    );

    return { message: '用戶已刪除' };
  }

  async blockUser(adminId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用戶不存在');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    await this.logService.record(
      'USER_BLOCKED', 
      adminId, 
      `管理員封鎖用戶 ${user.account}`,
      undefined, // ipAddress
      {
        blockedUserId: userId,
        blockedUserAccount: user.account,
      }
    );

    return { message: '用戶已封鎖' };
  }

  async unblockUser(adminId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用戶不存在');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    await this.logService.record(
      'USER_UNBLOCKED', 
      adminId, 
      `管理員解除封鎖用戶 ${user.account}`,
      undefined, // ipAddress
      {
        unblockedUserId: userId,
        unblockedUserAccount: user.account,
      }
    );

    return { message: '用戶已解除封鎖' };
  }

  async deleteProduct(adminId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'DELETED' },
    });

    await this.logService.record(
      'PRODUCT_DELETED_BY_ADMIN', 
      adminId, 
      `管理員刪除商品 ${product.name}`,
      undefined, // ipAddress
      {
        productId,
        productName: product.name,
        sellerId: product.sellerId,
        sellerName: product.seller.username,
      }
    );

    return { message: '商品已刪除' };
  }

  async getLogs(logsQuery: any) {
    const { page = 1, pageSize = 20, sortBy = '-createdAt', ...criteria } = logsQuery;
    
    const logs = await this.logService.query({
      ...criteria,
      sortBy,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const total = await this.logService.count(criteria);

    return {
      logs: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getUsers(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          account: true,
          username: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          shopName: true,
          _count: {
            select: {
              products: true,
              buyerOrders: true,
              sellerOrders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count(),
    ]);

    return {
      users: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getProducts(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              shopName: true,
            },
          },
          category: true,
          images: true,
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
      this.prisma.product.count(),
    ]);

    return {
      products: products,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOrders(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        include: {
          buyer: { select: { id: true, username: true } },
          seller: { select: { id: true, username: true, shopName: true } },
          items: {
            include: {
              productVariant: {
                include: {
                  product: { select: { id: true, name: true } }
                }
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count(),
    ]);

    return {
      orders: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, username: true } },
        seller: { select: { id: true, username: true, shopName: true } },
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  include: {
                    images: true,
                  }
                }
              }
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('訂單不存在');
    }
    return order;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus, adminId: number) {
    const order = await this.getOrder(orderId); // this also checks if order exists

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    
    await this.logService.record(
      'ORDER_STATUS_UPDATED_BY_ADMIN', 
      adminId, 
      `管理員更新訂單 ${orderId} 狀態：${order.status} → ${status}`,
      undefined, // ipAddress
      {
        orderId,
        previousStatus: order.status,
        newStatus: status,
      }
    );

    return updatedOrder;
  }
} 