import { IsEnum, IsNotEmpty } from 'class-validator';

// Manually define the enum to avoid prisma client generation issues
export enum OrderStatusEnum {
  UNCOMPLETED = 'UNCOMPLETED',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;
} 