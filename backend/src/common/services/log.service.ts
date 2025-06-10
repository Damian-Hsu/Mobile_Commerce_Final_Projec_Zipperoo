import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(event: string, actorId?: number, meta?: any): Promise<void> {
    try {
      await this.prisma.logEntry.create({
        data: {
          event,
          actorId,
          meta,
        },
      });
    } catch (error) {
      console.error('Failed to record log:', error);
    }
  }

  async query(criteria: any): Promise<any[]> {
    const where: any = {};
    
    if (criteria.event) {
      where.event = { contains: criteria.event };
    }
    
    if (criteria.actorId) {
      where.actorId = criteria.actorId;
    }
    
    if (criteria.startDate) {
      where.createdAt = { gte: new Date(criteria.startDate) };
    }
    
    if (criteria.endDate) {
      where.createdAt = { 
        ...where.createdAt,
        lte: new Date(criteria.endDate) 
      };
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
      orderBy: { createdAt: 'desc' },
      take: criteria.limit || 100,
      skip: criteria.offset || 0,
    });
  }
} 