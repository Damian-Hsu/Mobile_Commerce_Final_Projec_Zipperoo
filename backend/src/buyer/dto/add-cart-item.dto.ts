import { IsInt, IsPositive } from 'class-validator';

export class AddCartItemDto {
  @IsInt()
  @IsPositive()
  productVariantId: number;

  @IsInt()
  @IsPositive()
  quantity: number;
} 