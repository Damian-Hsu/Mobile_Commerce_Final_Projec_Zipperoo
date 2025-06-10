import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateVariantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  price?: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsObject()
  @IsOptional()
  attributes?: any;
} 