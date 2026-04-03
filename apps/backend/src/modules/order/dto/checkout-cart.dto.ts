import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from "class-validator";

import { PaymentMethod } from "@twizrr/shared";

export class CheckoutCartDto {
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayNotEmpty()
  cartItemIds: string[];

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsOptional()
  @IsObject()
  deliveryDetails?: Record<string, any>;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: "ESCROW" | "DIRECT";

  @IsIn(["MERCHANT_DELIVERY", "PLATFORM_LOGISTICS"])
  @IsOptional()
  deliveryMethod?: "MERCHANT_DELIVERY" | "PLATFORM_LOGISTICS";

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
