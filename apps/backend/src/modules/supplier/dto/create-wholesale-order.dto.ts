import { IsUUID, IsInt, Min, IsString } from "class-validator";

export class CreateWholesaleOrderDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  deliveryAddress!: string;
}
