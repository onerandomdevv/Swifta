import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { PaymentMethod } from "@hardware-os/shared";

export class CheckoutCartDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty()
  cartItemIds: string[];

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: "ESCROW" | "DIRECT";

  @IsIn(["MERCHANT_DELIVERY", "PLATFORM_LOGISTICS"])
  @IsOptional()
  deliveryMethod?: "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS";
}
