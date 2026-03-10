import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}
