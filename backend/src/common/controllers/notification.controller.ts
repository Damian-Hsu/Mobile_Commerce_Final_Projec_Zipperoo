import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ResponseDto } from '../dto/response.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('通知系統')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get('counts')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  @ApiOperation({ summary: '獲取通知計數', description: '獲取購物車數量、未讀訊息數量和未處理訂單數量' })
  @ApiResponse({ status: 200, description: '獲取通知計數成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getCounts(@CurrentUser() user: any) {
    const [cartCount, unreadMessageCount, pendingOrderCount] = await Promise.all([
      this.getCartCount(user.id, user.role),
      this.getUnreadMessageCount(user.id),
      this.getPendingOrderCount(user.id, user.role),
    ]);

    const result = {
      cartCount: cartCount,
      unreadMessageCount: unreadMessageCount,
      pendingOrderCount: pendingOrderCount,
    };

    return ResponseDto.success(result, '獲取通知計數成功');
  }

  private async getCartCount(userId: number, userRole: string): Promise<number> {
    // Only buyers have shopping carts
    if (userRole !== 'BUYER') {
      return 0;
    }

    const cart = await this.prisma.cart.findUnique({
      where: { buyerId: userId },
      include: {
        items: true, // 計算所有商品，不只是被選中的
      },
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  private async getUnreadMessageCount(userId: number): Promise<number> {
    // Get all rooms where user is participant
    const userRooms = await this.prisma.chatRoom.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
      },
    });

    if (userRooms.length === 0) {
      return 0;
    }

    // Count unread messages for this user
    let unreadCount = 0;

    for (const room of userRooms) {
      const isBuyer = room.buyerId === userId;
      const isSeller = room.sellerId === userId;

      const whereCondition: any = {
        roomId: room.id,
        fromUserId: { not: userId }, // Don't count own messages
      };

      if (isBuyer) {
        whereCondition.isReadByBuyer = false;
      } else if (isSeller) {
        whereCondition.isReadBySeller = false;
      }

      const count = await this.prisma.chatMessage.count({
        where: whereCondition,
      });

      unreadCount += count;
    }

    return unreadCount;
  }

  private async getPendingOrderCount(userId: number, userRole: string): Promise<number> {
    // Only sellers have pending orders to process
    if (userRole !== 'SELLER') {
      return 0;
    }

    // Count orders that need seller action (UNCOMPLETED orders)
    const pendingOrderCount = await this.prisma.order.count({
      where: {
        sellerId: userId,
        status: 'UNCOMPLETED', // 未完成的訂單需要賣家處理
      },
    });

    return pendingOrderCount;
  }
} 