import { IsInt, IsPositive, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  isSelected?: boolean;
} 