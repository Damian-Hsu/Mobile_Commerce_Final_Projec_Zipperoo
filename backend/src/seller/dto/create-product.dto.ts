import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';

class VariantDto {
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsInt()
    @Min(0)
    price: number;
  
    @IsInt()
    @Min(0)
    stock: number;
  
    @IsObject()
    @IsOptional()
    attributes?: any;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsArray()
  @IsUrl({}, { each: true, message: '每個圖片URL必須是有效的網址' })
  @ArrayMaxSize(10, { message: '最多只能上傳10張圖片' })
  @IsOptional()
  imageUrls?: string[];
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];

  @IsOptional()
  @IsString()
  @IsIn(['ON_SHELF', 'OFF_SHELF'])
  status?: 'ON_SHELF' | 'OFF_SHELF';
} 