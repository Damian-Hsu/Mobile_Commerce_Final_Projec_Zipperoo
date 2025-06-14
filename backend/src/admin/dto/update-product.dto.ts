import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ProductStatus {
  ON_SHELF = 'ON_SHELF',
  OFF_SHELF = 'OFF_SHELF',
  DELETED = 'DELETED',
}

export class UpdateProductDto {
  @ApiProperty({ description: '商品名稱', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '商品描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: '商品狀態', 
    enum: ProductStatus,
    required: false 
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
} 