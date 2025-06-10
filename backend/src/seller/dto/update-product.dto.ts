import { IsString, IsInt, IsPositive, IsOptional, MinLength, IsArray, IsIn } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number; // in cents

  @IsOptional()
  @IsInt()
  @IsPositive()
  stock?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ON_SHELF', 'OFF_SHELF'])
  status?: 'ON_SHELF' | 'OFF_SHELF';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
} 