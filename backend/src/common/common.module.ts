import { Module } from '@nestjs/common';
import { LogService } from './services/log.service';
import { ProductController } from './controllers/product.controller';
import { NotificationController } from './controllers/notification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductController, NotificationController],
  providers: [LogService],
  exports: [LogService],
})
export class CommonModule {} 