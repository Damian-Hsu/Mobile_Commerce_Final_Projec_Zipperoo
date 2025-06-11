import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { Public } from '../common/decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('認證系統')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '用戶註冊', description: '註冊新用戶賬號' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '註冊成功' })
  @ApiResponse({ status: 400, description: '請求參數錯誤' })
  @ApiResponse({ status: 409, description: '用戶已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ResponseDto.created(result, '註冊成功');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用戶登入', description: '用戶登入系統' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '登入成功' })
  @ApiResponse({ status: 401, description: '用戶名或密碼錯誤' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return ResponseDto.success(result, '登入成功');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '忘記密碼', description: '發送密碼重置郵件' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: '密碼重置郵件已發送' })
  @ApiResponse({ status: 404, description: '用戶不存在' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return ResponseDto.success(result, result.message);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密碼', description: '使用重置令牌重置密碼' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: '密碼重置成功' })
  @ApiResponse({ status: 400, description: '重置令牌無效或已過期' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return ResponseDto.success(result, result.message);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '用戶登出', description: '用戶登出系統' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  async logout(@CurrentUser() user: any) {
    await this.authService.logout(user.id);
    return ResponseDto.success(null, '登出成功');
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '獲取個人資料', description: '獲取當前用戶的個人資料' })
  @ApiResponse({ status: 200, description: '獲取個人資料成功' })
  @ApiResponse({ status: 401, description: '未認證用戶' })
  async getProfile(@CurrentUser() user: any) {
    const result = await this.authService.getProfile(user.id);
    return ResponseDto.success(result, '獲取個人資料成功');
  }
} 