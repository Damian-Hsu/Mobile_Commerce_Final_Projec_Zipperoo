import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LogService } from '../common/services/log.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let logService: LogService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cart: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockLogService = {
    record: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: LogService, useValue: mockLogService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    logService = module.get<LogService>(LogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      account: 'testuser',
      password: 'password123',
      username: 'Test User',
      email: 'test@example.com',
      role: 'BUYER' as const,
    };

    it('should register a new buyer successfully', async () => {
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 1,
        account: 'testuser',
        username: 'Test User',
        email: 'test@example.com',
        role: 'BUYER',
        passwordHash: hashedPassword,
        shopName: null,
        description: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.cart.create.mockResolvedValue({ id: 1, buyerId: 1 });
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockConfigService.get.mockReturnValue('mock-secret');

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { account: 'testuser' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.cart.create).toHaveBeenCalledWith({
        data: { buyerId: 1 },
      });
      expect(mockLogService.record).toHaveBeenCalledWith(
        'USER_REGISTERED',
        1,
        { account: 'testuser', role: 'BUYER' },
      );
      expect(result.accessToken).toBe('mock-token');
      expect(result.user.account).toBe('testuser');
    });

    it('should throw ConflictException if account already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      account: 'testuser',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        account: 'testuser',
        username: 'Test User',
        email: 'test@example.com',
        role: 'BUYER',
        passwordHash: 'hashedPassword',
        isBlocked: false,
        shopName: null,
        description: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('mock-token');
      mockConfigService.get.mockReturnValue('mock-secret');

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { account: 'testuser' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockLogService.record).toHaveBeenCalledWith(
        'USER_LOGIN',
        1,
        { account: 'testuser' },
      );
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is blocked', async () => {
      const mockUser = {
        id: 1,
        account: 'testuser',
        isBlocked: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: 1,
        account: 'testuser',
        passwordHash: 'hashedPassword',
        isBlocked: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 