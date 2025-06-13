import { IsString, IsInt, IsPositive, IsOptional, MinLength, IsArray, IsIn, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ProductVariantDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsInt()
  @IsPositive()
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
  @IsIn(['ON_SHELF', 'OFF_SHELF', 'OUT_OF_STOCK'])
  status?: 'ON_SHELF' | 'OFF_SHELF' | 'OUT_OF_STOCK';

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