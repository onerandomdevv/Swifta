import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class CreateDirectOrderDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;
}
