import { IsString, IsInt, IsPositive, IsOptional, MinLength, IsArray, IsIn, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ProductVariantDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @Min(0, { message: '庫存數量不能為負數' })
  stock: number;
}

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
  categoryId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ON_SHELF', 'OFF_SHELF', 'DELETED'])
  status?: 'ON_SHELF' | 'OFF_SHELF' | 'DELETED';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];
} 