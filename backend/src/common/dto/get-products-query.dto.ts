import { IsOptional, IsString, IsIn, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

const allowedSortBy = ['createdAt', 'name'];
const allowedSortOrder = ['asc', 'desc'];

export class GetProductsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(allowedSortBy, { message: `sortBy must be one of the following values: ${allowedSortBy.join(', ')}` })
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(allowedSortOrder, { message: `sortOrder must be one of the following values: ${allowedSortOrder.join(', ')}` })
  sortOrder: 'asc' | 'desc' = 'desc';
} 