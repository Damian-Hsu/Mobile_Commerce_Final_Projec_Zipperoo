import { IsString, IsEmail, IsOptional, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  account!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  username!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsIn(['BUYER', 'SELLER',])// 'ADMIN']) //[dev] 不得不說，這樣超級危險
  role!: 'BUYER' | 'SELLER' ;//| 'ADMIN';

  // Seller specific fields
  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsString()
  description?: string;
} 