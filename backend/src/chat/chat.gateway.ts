import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, { userId: number; socketId: string }>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      this.connectedUsers.set(client.id, { userId, socketId: client.id });
      
      client.join(`user_${userId}`);
      console.log(`User ${userId} connected to chat`);
    } catch (error) {
      console.error('Chat connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo) {
      console.log(`User ${userInfo.userId} disconnected from chat`);
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: '未認證用戶' });
        return;
      }

      // Verify user has access to this room
      await this.chatService.getMessages(data.roomId, userInfo.userId, 1, 1);
      
      client.join(`room_${data.roomId}`);
      client.emit('joinedRoom', { roomId: data.roomId });
      
      console.log(`User ${userInfo.userId} joined room ${data.roomId}`);
    } catch (error) {
      client.emit('error', { message: '加入聊天室失敗' });
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    client.leave(`room_${data.roomId}`);
    client.emit('leftRoom', { roomId: data.roomId });
  }

  @SubscribeMessage('chatMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number; content: string },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: '未認證用戶' });
        return;
      }

      const result = await this.chatService.sendMessage(
        data.roomId,
        userInfo.userId,
        data.content,
      );

      // Emit to all users in the room
      this.server.to(`room_${data.roomId}`).emit('newMessage', {
        message: result.message,
        room: result.room,
      });

      // Also emit to user rooms for real-time room list updates
      this.server.to(`user_${result.room.buyerId}`).emit('roomUpdated', result.room);
      this.server.to(`user_${result.room.sellerId}`).emit('roomUpdated', result.room);

      // Notify recipient about unread count update
      const recipientId = result.room.buyerId === userInfo.userId ? result.room.sellerId : result.room.buyerId;
      this.notifyUnreadCountUpdate(recipientId);

    } catch (error) {
      client.emit('error', { message: '發送訊息失敗' });
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number; page?: number; pageSize?: number },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: '未認證用戶' });
        return;
      }

      const messages = await this.chatService.getMessages(
        data.roomId,
        userInfo.userId,
        data.page || 1,
        data.pageSize || 50,
      );

      client.emit('messages', messages);
    } catch (error) {
      client.emit('error', { message: '獲取訊息失敗' });
    }
  }

  @SubscribeMessage('markMessagesRead')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: '未認證用戶' });
        return;
      }

      const result = await this.chatService.markMessagesAsRead(
        data.roomId,
        userInfo.userId,
      );

      // Emit to the user who marked messages as read
      client.emit('messagesMarkedRead', result);

      // Emit to all users in the room to update read status
      this.server.to(`room_${data.roomId}`).emit('readStatusUpdated', {
        roomId: data.roomId,
        userId: userInfo.userId,
        markedCount: result.markedCount,
      });

      // Update unread count for the user
      const unreadCount = await this.chatService.getUnreadCount(userInfo.userId);
      client.emit('unreadCountUpdated', unreadCount);

    } catch (error) {
      client.emit('error', { message: '標記訊息失敗' });
    }
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    try {
      const userInfo = this.connectedUsers.get(client.id);
      if (!userInfo) {
        client.emit('error', { message: '未認證用戶' });
        return;
      }

      const unreadCount = await this.chatService.getUnreadCount(userInfo.userId);
      client.emit('unreadCount', unreadCount);
    } catch (error) {
      client.emit('error', { message: '獲取未讀數量失敗' });
    }
  }

  // Helper method to notify users about unread count changes
  async notifyUnreadCountUpdate(userId: number) {
    try {
      const unreadCount = await this.chatService.getUnreadCount(userId);
      this.server.to(`user_${userId}`).emit('unreadCountUpdated', unreadCount);
    } catch (error) {
      console.error('Failed to notify unread count update:', error);
    }
  }
} 