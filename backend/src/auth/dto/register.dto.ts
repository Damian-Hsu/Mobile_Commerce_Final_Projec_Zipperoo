import { IsString, IsEmail, IsOptional, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '用戶帳號',
    example: 'john_doe',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  account!: string;

  @ApiProperty({
    description: '用戶密碼',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: '用戶名稱',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  username!: string;

  @ApiPropertyOptional({
    description: '電子郵件地址',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: '手機號碼',
    example: '+886912345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '用戶角色',
    enum: ['BUYER', 'SELLER'],
    example: 'BUYER',
  })
  @IsString()
  @IsIn(['BUYER', 'SELLER',])// 'ADMIN']) //[dev] 不得不說，這樣超級危險
  role!: 'BUYER' | 'SELLER' ;//| 'ADMIN';

  // Seller specific fields
  @ApiPropertyOptional({
    description: '商店名稱（僅限賣家）',
    example: 'John\'s Shop',
  })
  @IsOptional()
  @IsString()
  shopName?: string;

  @ApiPropertyOptional({
    description: '商店描述（僅限賣家）',
    example: '專營電子產品的優質商店',
  })
  @IsOptional()
  @IsString()
  description?: string;
} 