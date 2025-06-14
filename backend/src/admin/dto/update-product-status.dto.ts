import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateProductStatusDto {
  @ApiProperty({ 
    description: '商品狀態', 
    enum: ProductStatus,
    example: 'ON_SHELF'
  })
  @IsEnum(ProductStatus, { 
    message: '狀態必須是 ON_SHELF, OFF_SHELF, 或 DELETED 之一' 
  })
  status: ProductStatus;
} 