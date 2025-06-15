import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class SellerProductsQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ON_SHELF', 'OFF_SHELF', 'OUT_OF_STOCK'], { 
    message: 'status must be one of: ON_SHELF, OFF_SHELF, OUT_OF_STOCK' 
  })
  status?: string;
} 