import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../common/services/log.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService,
  ) {}

  async createOrGetRoom(buyerId: number, sellerId: number) {
    // Verify that the users exist and have correct roles
    const [buyer, seller] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: buyerId, role: 'BUYER' },
      }),
      this.prisma.user.findFirst({
        where: { id: sellerId, role: 'SELLER' },
      }),
    ]);

    if (!buyer) {
      throw new NotFoundException('買家不存在');
    }

    if (!seller) {
      throw new NotFoundException('賣家不存在');
    }

    // Try to find existing room
    let room = await this.prisma.chatRoom.findUnique({
      where: {
        buyerId_sellerId: {
          buyerId,
          sellerId,
        },
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            shopName: true,
          },
        },
      },
    });

    // Create room if it doesn't exist
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          buyerId,
          sellerId,
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              shopName: true,
            },
          },
        },
      });

      await this.logService.record(
        'CHAT_ROOM_CREATED', 
        buyerId, 
        `創建聊天室`,
        undefined, // ipAddress
        {
          roomId: room.id,
          sellerId,
        }
      );
    }

    return room;
  }

  async getMessages(roomId: number, userId: number, page: number = 1, pageSize: number = 50) {
    // Verify user has access to this room
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
      },
    });

    if (!room) {
      throw new ForbiddenException('無權訪問此聊天室');
    }

    const skip = (page - 1) * pageSize;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { roomId },
        include: {
          fromUser: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.chatMessage.count({
        where: { roomId },
      }),
    ]);

    return {
      data: messages.reverse(), // Reverse to show oldest first
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async sendMessage(roomId: number, fromUserId: number, content: string) {
    // Verify user has access to this room
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { buyerId: fromUserId },
          { sellerId: fromUserId },
        ],
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            shopName: true,
          },
        },
      },
    });

    if (!room) {
      throw new ForbiddenException('無權訪問此聊天室');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        fromUserId,
        content,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    await this.logService.record(
      'CHAT_MESSAGE_SENT', 
      fromUserId, 
      `發送聊天訊息`,
      undefined, // ipAddress
      {
        roomId,
        messageId: message.id,
      }
    );

    return {
      message,
      room,
    };
  }

  async getUserRooms(userId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [rooms, total] = await Promise.all([
      this.prisma.chatRoom.findMany({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
        },
        include: {
          buyer: {
            select: {
              id: true,
              username: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
              shopName: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              fromUser: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.chatRoom.count({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
        },
      }),
    ]);

    return {
      data: rooms,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
} 