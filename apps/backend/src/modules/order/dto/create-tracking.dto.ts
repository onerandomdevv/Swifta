import { IsIn, IsString, IsOptional } from "class-validator";
import { OrderStatus } from "@twizrr/shared";

export class CreateTrackingDto {
  @IsIn(
    [OrderStatus.PREPARING, OrderStatus.DISPATCHED, OrderStatus.IN_TRANSIT],
    {
      message:
        "status must be a valid tracking status: PREPARING, DISPATCHED, or IN_TRANSIT",
    },
  )
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
