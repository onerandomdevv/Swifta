import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  IsOptional,
  IsEnum,
} from "class-validator";

enum PaymentMethodDto {
  ESCROW = "ESCROW",
  DIRECT = "DIRECT",
}

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

  @IsOptional()
  @IsEnum(PaymentMethodDto, { message: "paymentMethod must be ESCROW or DIRECT" })
  paymentMethod?: "ESCROW" | "DIRECT";
}
