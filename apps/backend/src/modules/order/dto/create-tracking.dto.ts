import { IsEnum, IsString, IsOptional } from 'class-validator';
import { OrderStatus } from '@hardware-os/shared';

export class CreateTrackingDto {
  @IsEnum(OrderStatus, { message: 'status must be a valid OrderStatus like PREPARING, DISPATCHED, IN_TRANSIT, or DELIVERED' })
  status: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
