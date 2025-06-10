import { IsOptional, IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要選擇一個購物車項目' })
  @IsInt({ each: true, message: '購物車項目ID必須為整數' })
  cartItemIds?: number[];
} 