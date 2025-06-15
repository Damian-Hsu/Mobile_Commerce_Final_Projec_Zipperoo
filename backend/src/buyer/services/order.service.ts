import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../common/services/log.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async checkout(buyerId: number, checkoutData: { cartItemIds?: number[], shippingAddress?: any, paymentMethod?: string }) {
    return await this.prisma.$transaction(async (tx) => {
      // Get cart with items, including variant and product details
      const cart = await tx.cart.findUnique({
        where: { buyerId },
        include: {
          items: {
            include: {
              productVariant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('購物車為空');
      }

      // Filter items based on specified cartItemIds or selected items
      let itemsToCheckout;
      if (checkoutData.cartItemIds && checkoutData.cartItemIds.length > 0) {
        // Use specified cart item IDs
        itemsToCheckout = cart.items.filter(item => checkoutData.cartItemIds.includes(item.id));
        
        if (itemsToCheckout.length === 0) {
          throw new BadRequestException('指定的購物車項目不存在');
        }
        
        if (itemsToCheckout.length !== checkoutData.cartItemIds.length) {
          throw new BadRequestException('部分指定的購物車項目不存在');
        }
      } else {
        // Use selected items (backward compatibility)
        itemsToCheckout = cart.items.filter(item => item.isSelected);
        
        if (itemsToCheckout.length === 0) {
          throw new BadRequestException('購物車為空或沒有選中的商品');
        }
      }

      // Group items by seller
      const itemsBySeller = itemsToCheckout.reduce((groups: any, item: any) => {
        const sellerId = item.productVariant.product.sellerId;
        if (!groups[sellerId]) {
          groups[sellerId] = [];
        }
        groups[sellerId].push(item);
        return groups;
      }, {});

      const orders = [];

      // Create separate order for each seller
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const sellerItems = items as any[];
        
        // Check stock availability
        for (const item of sellerItems) {
          if (item.productVariant.stock < item.quantity) {
            throw new BadRequestException(`商品 ${item.productVariant.product.name} - ${item.productVariant.name} 庫存不足`);
          }
          if (item.productVariant.product.status !== 'ON_SHELF') {
            throw new BadRequestException(`商品 ${item.productVariant.product.name} 已下架`);
          }
        }

        const totalAmount = sellerItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        const order = await tx.order.create({
          data: {
            buyerId,
            sellerId: parseInt(sellerId),
            totalAmount,
            status: 'UNCOMPLETED',
            // Shipping Information - use dummy values for now since they were removed
            recipientName: checkoutData.shippingAddress?.recipientName || '待填寫',
            recipientPhone: checkoutData.shippingAddress?.recipientPhone || '待填寫',
            city: checkoutData.shippingAddress?.city || '待填寫',
            district: checkoutData.shippingAddress?.district || '待填寫',
            postalCode: checkoutData.shippingAddress?.postalCode || '00000',
            address: checkoutData.shippingAddress?.address || '待填寫',
            notes: checkoutData.shippingAddress?.notes || null,
            // Payment Information
            paymentMethod: (checkoutData.paymentMethod as any) || 'COD',
          }as any,
        });

        // Create order items and update stock
        for (const item of sellerItems) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });

          // Update product variant stock
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        orders.push(order);

        // Remove items from cart
        await tx.cartItem.deleteMany({
          where: { id: { in: sellerItems.map((item) => item.id) } },
        });
      }

      await this.logService.record(
        'ORDER_CREATED', 
        buyerId, 
        `創建 ${orders.length} 個訂單`,
        undefined, // ipAddress
        {
          orderIds: orders.map(o => o.id),
          cartItemIds: itemsToCheckout.map(item => item.id),
        }
      );

      return orders;
    });
  }

  async getOrders(buyerId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId },
        include: {
          seller: { select: { id: true, username: true, shopName: true } },
          items: {
            include: {
              productVariant: {
                include: {
                  product: { include: { images: true } },
                },
              },
            },
          },

        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where: { buyerId } }),
    ]);

    return { data: orders, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async getOrder(buyerId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, buyerId },
      include: {
        seller: { select: { id: true, username: true, shopName: true } },
        items: {
          include: {
            productVariant: {
              include: {
                product: { include: { images: true } },
              },
            },
          },
        },

      },
    });
    if (!order) throw new NotFoundException('訂單不存在');
    return order;
  }

  async cancelOrder(buyerId: number, orderId: number) {
    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, buyerId },
        include: { items: true },
      });

      if (!order) throw new NotFoundException('訂單不存在');
      if (order.status !== 'UNCOMPLETED') throw new BadRequestException('只能取消未完成的訂單');
      
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELED' },
      });

      // Restore product variant stock
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await this.logService.record(
        'ORDER_CANCELED', 
        buyerId, 
        `取消訂單 ${orderId}`,
        undefined, // ipAddress
        { orderId }
      );
      return { message: '訂單已取消' };
    });
  }
} 