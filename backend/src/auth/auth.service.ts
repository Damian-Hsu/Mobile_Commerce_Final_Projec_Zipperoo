import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../common/services/log.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logService: LogService,
  ) {}
  private static async __hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
  private static async __comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if account already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { account: registerDto.account },
    });

    if (existingUser) {
      throw new ConflictException('帳號已存在');
    }

    // Hash password
    const passwordHash = await AuthService.__hashPassword(registerDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        account: registerDto.account,
        passwordHash,
        username: registerDto.username,
        email: registerDto.email,
        phone: registerDto.phone,
        role: registerDto.role,
        shopName: registerDto.shopName,
        description: registerDto.description,
      },
    });

    // Create cart for buyer
    if (user.role === 'BUYER') {
      await this.prisma.cart.create({
        data: {
          buyerId: user.id,
        },
      });
    }

    // Log registration
    await this.logService.record('USER_REGISTERED', user.id, {
      account: user.account,
      role: user.role,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        account: user.account,
        username: user.username,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: user.role,
        shopName: user.shopName || undefined,
        description: user.description || undefined,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { account: loginDto.account },
    });

    if (!user) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('帳號已被封鎖');
    }

    // Verify password
    const isPasswordValid = await AuthService.__comparePassword(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    // Log login
    await this.logService.record('USER_LOGIN', user.id, {
      account: user.account,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      ...tokens,
      user: {
        id: user.id,
        account: user.account,
        username: user.username,
        email: user.email || undefined,
        phone: user.phone || undefined,
        role: user.role,
        shopName: user.shopName || undefined,
        description: user.description || undefined,
      },
    };
  }

  async logout(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { account: true },
    });
  
    if (user) {
      await this.logService.record('USER_LOGOUT', userId, {
        account: user.account,
      });
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        account: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        shopName: true,
        description: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用戶不存在');
    }

    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string , token: string}> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      // To prevent email enumeration, we don't reveal if the email exists.
      // We'll just return a success message. The email will not be sent.
      return { message: 'If a user with this email exists, a password reset link has been sent.' , token: null};
    }

    // Generate a reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the token in the database
    await this.prisma.passwordResetToken.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });

    // In a real application, I would send an email to the user with the token.
    // For this project, I'll just return a success message.
    //console.log(`Password reset token for ${email}: ${token}`); // Log token for testing

    return { message: "If a user with this email exists, a password reset link has been sent.",
            token: token};
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const savedToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }

    // Hash the new password
    const passwordHash = await AuthService.__hashPassword(newPassword);

    // Update user's password
    await this.prisma.user.update({
      where: { email: savedToken.email },
      data: { passwordHash },
    });

    // Delete the used token
    await this.prisma.passwordResetToken.delete({
      where: { id: savedToken.id },
    });

    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(userId: number) {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('REFRESH_JWT_SECRET'),
        expiresIn: this.configService.get('REFRESH_JWT_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
} 