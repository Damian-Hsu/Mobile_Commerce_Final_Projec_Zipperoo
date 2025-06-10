import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async createOrGetRoom(
    @CurrentUser() user: any,
    @Body() body: { buyerId?: number; sellerId?: number },
  ) {
    let buyerId: number;
    let sellerId: number;

    if (user.role === 'BUYER') {
      buyerId = user.id;
      sellerId = body.sellerId!;
    } else {
      buyerId = body.buyerId!;
      sellerId = user.id;
    }

    const result = await this.chatService.createOrGetRoom(buyerId, sellerId);
    return ResponseDto.success(result, '聊天室創建/獲取成功');
  }

  @Get('rooms')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async getUserRooms(@CurrentUser() user: any, @Query() paginationDto: PaginationDto) {
    const result = await this.chatService.getUserRooms(
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取聊天室列表成功');
  }

  @Get('rooms/:roomId/messages')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async getMessages(
    @CurrentUser() user: any,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.chatService.getMessages(
      roomId,
      user.id,
      paginationDto.page,
      paginationDto.pageSize,
    );
    return ResponseDto.success(result, '獲取訊息成功');
  }

  @Post('rooms/:roomId/messages')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() body: { content: string },
  ) {
    const result = await this.chatService.sendMessage(roomId, user.id, body.content);
    return ResponseDto.created(result.message, '訊息發送成功');
  }
} 