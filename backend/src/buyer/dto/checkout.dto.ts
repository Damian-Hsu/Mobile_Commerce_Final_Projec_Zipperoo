import { IsOptional, IsArray, IsInt, ArrayMinSize, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckoutDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要選擇一個購物車項目' })
  @IsInt({ each: true, message: '購物車項目ID必須為整數' })
  cartItemIds?: number[];

  @IsNotEmpty()
  shippingAddress: ShippingAddressDto;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
} 