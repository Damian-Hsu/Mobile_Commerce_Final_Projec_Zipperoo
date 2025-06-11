import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
} 