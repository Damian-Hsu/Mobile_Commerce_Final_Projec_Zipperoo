import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    event: string, 
    actorId?: number, 
    description?: string,
    ipAddress?: string,
    meta?: any
  ): Promise<void> {
    try {
      await this.prisma.logEntry.create({
        data: {
          event,
          actorId,
          description,
          ipAddress,
          meta,
        },
      }as any);
    } catch (error) {
      console.error('Failed to record log:', error);
    }
  }

  async query(criteria: any): Promise<any[]> {
    const where: any = {};
    
    // 事件類型搜尋
    if (criteria.event) {
      where.event = { contains: criteria.event, mode: 'insensitive' };
    }
    
    // 操作者ID搜尋
    if (criteria.actorId) {
      where.actorId = criteria.actorId;
    }

    // IP地址搜尋
    if (criteria.ip) {
      where.ipAddress = { contains: criteria.ip, mode: 'insensitive' };
    }

    // 用戶名搜尋
    if (criteria.username) {
      where.actor = {
        OR: [
          { username: { contains: criteria.username, mode: 'insensitive' } },
          { account: { contains: criteria.username, mode: 'insensitive' } }
        ]
      };
    }

    // 通用搜尋（搜尋事件、描述、用戶名、IP等）
    if (criteria.search) {
      const searchTerm = criteria.search;
      where.OR = [
        { event: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { ipAddress: { contains: searchTerm, mode: 'insensitive' } },
        { 
          actor: {
            OR: [
              { username: { contains: searchTerm, mode: 'insensitive' } },
              { account: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }
    
    // 時間範圍搜尋
    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      
      if (criteria.startDate) {
        where.createdAt.gte = new Date(criteria.startDate);
      }
      
      if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        // 設置為當天的23:59:59
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // 處理排序
    let orderBy: any = { createdAt: 'desc' }; // 默認按時間降序
    if (criteria.sortBy) {
      if (criteria.sortBy.startsWith('-')) {
        const field = criteria.sortBy.substring(1);
        orderBy = { [field]: 'desc' };
      } else {
        orderBy = { [criteria.sortBy]: 'asc' };
      }
    }

    return this.prisma.logEntry.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            account: true,
            role: true,
          },
        },
      },
      orderBy,
      take: criteria.limit || 100,
      skip: criteria.offset || 0,
    });
  }

  async count(criteria: any): Promise<number> {
    const where: any = {};
    
    // 複製query方法中的where條件邏輯
    if (criteria.event) {
      where.event = { contains: criteria.event, mode: 'insensitive' };
    }
    
    if (criteria.actorId) {
      where.actorId = criteria.actorId;
    }

    if (criteria.ip) {
      where.ipAddress = { contains: criteria.ip, mode: 'insensitive' };
    }

    if (criteria.username) {
      where.actor = {
        OR: [
          { username: { contains: criteria.username, mode: 'insensitive' } },
          { account: { contains: criteria.username, mode: 'insensitive' } }
        ]
      };
    }

    if (criteria.search) {
      const searchTerm = criteria.search;
      where.OR = [
        { event: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { ipAddress: { contains: searchTerm, mode: 'insensitive' } },
        { 
          actor: {
            OR: [
              { username: { contains: searchTerm, mode: 'insensitive' } },
              { account: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }
    
    if (criteria.startDate || criteria.endDate) {
      where.createdAt = {};
      
      if (criteria.startDate) {
        where.createdAt.gte = new Date(criteria.startDate);
      }
      
      if (criteria.endDate) {
        const endDate = new Date(criteria.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    return this.prisma.logEntry.count({ where });
  }
} 