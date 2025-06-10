import { IsArray, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  price: number;

  @IsInt()
  stock: number;

  @IsObject()
  @IsOptional()
  attributes?: any;
}

export class CreateVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];
} 