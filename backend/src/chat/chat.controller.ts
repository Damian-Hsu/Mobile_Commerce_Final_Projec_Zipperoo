import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('聊天系統')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @Roles('BUYER', 'SELLER', 'ADMIN')
  @ApiOperation({ summary: '創建或獲取聊天室', description: '買家和賣家之間創建或獲取聊天室' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'number', description: '買家ID（賣家提供）' },
        sellerId: { type: 'number', description: '賣家ID（買家提供）' }
      }
    }
  })
  @ApiResponse({ status: 201, description: '聊天室創建/獲取成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
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
  @ApiOperation({ summary: '獲取聊天室列表', description: '獲取當前用戶的所有聊天室' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取聊天室列表成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足' })
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
  @ApiOperation({ summary: '獲取聊天訊息', description: '獲取指定聊天室的訊息記錄' })
  @ApiParam({ name: 'roomId', type: 'number', description: '聊天室ID' })
  @ApiQuery({ name: 'page', type: 'number', required: false, description: '頁碼' })
  @ApiQuery({ name: 'pageSize', type: 'number', required: false, description: '每頁數量' })
  @ApiResponse({ status: 200, description: '獲取訊息成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或無聊天室訪問權限' })
  @ApiResponse({ status: 404, description: '聊天室不存在' })
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
  @ApiOperation({ summary: '發送訊息', description: '在指定聊天室中發送訊息' })
  @ApiParam({ name: 'roomId', type: 'number', description: '聊天室ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '訊息內容' }
      },
      required: ['content']
    }
  })
  @ApiResponse({ status: 201, description: '訊息發送成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤或訊息內容為空' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  @ApiResponse({ status: 403, description: '權限不足或無聊天室訪問權限' })
  @ApiResponse({ status: 404, description: '聊天室不存在' })
  async sendMessage(
    @CurrentUser() user: any,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() body: { content: string },
  ) {
    const result = await this.chatService.sendMessage(roomId, user.id, body.content);
    return ResponseDto.created(result.message, '訊息發送成功');
  }
} 